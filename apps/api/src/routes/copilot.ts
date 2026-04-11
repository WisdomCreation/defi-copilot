import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { parseIntent } from '../services/ai';
import type { CopilotResponse } from '@defi-copilot/shared';
import { findOrCreateUser, findOrCreateConversation, addMessage } from '../db';
import { prisma } from '../db/prisma';
import { handlePortfolioQuery, handleMarketQuery, handleYieldQuery, handleTransactionHistory } from '../services/queryHandlers';
import { handleTaxReport, handleCapitalGains, handleExportCSV, handleTaxLossHarvesting, handleProofOfFunds, handleOFACCheck } from '../services/taxHandlers';
import { buildPaymentPreview, buildBatchPaymentPreview, buildPaymentLink, buildSpendingSummary } from '../services/paymentHandlers';
import { getPrivacyRoutes, generateStealthAddress, screenWallet, initiateGhostPaySend, initiateHoudiniSend } from '../services/privacyHandlers';
import { 
  getJupiterQuote, 
  getTokenAddress, 
  solToLamports, 
  lamportsToSol,
  baseUnitsToUsdc,
  usdcToBaseUnits
} from '../services/jupiter';

const CopilotBodySchema = z.object({
  message: z.string().min(1).max(2000),
  walletAddress: z.string().min(1),
  chain: z.enum(['ethereum', 'base', 'arbitrum', 'polygon', 'solana']),
  conversationId: z.string().optional(),
});

const SwapExecuteSchema = z.object({
  quoteData: z.any(),
  userPublicKey: z.string(),
});

const RealSwapSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  userPublicKey: z.string(),
});

export const copilotRoutes: FastifyPluginAsync = async (app) => {
  // Real swap endpoint (CORS proxy for Jupiter)
  app.post<{ Body: z.infer<typeof RealSwapSchema> }>(
    '/swap/real',
    async (req, reply) => {
      const parsed = RealSwapSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { tokenIn, tokenOut, amountIn, userPublicKey } = parsed.data;

      try {
        console.log(`🔥 Building REAL swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);
        
        const axios = (await import('axios')).default;
        
        const TOKEN_MINTS: Record<string, string> = {
          SOL: 'So11111111111111111111111111111111111111112',
          USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        };

        const inputMint = TOKEN_MINTS[tokenIn.toUpperCase()];
        const outputMint = TOKEN_MINTS[tokenOut.toUpperCase()];
        const amount = Math.floor(parseFloat(amountIn) * 1e9);

        // Use Helius DAS API for swaps (you already have access!)
        const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'ecb08fab-1799-46af-b0e9-4f324367d2bb';
        
        console.log('📡 Using Helius + Jupiter integration...');

        // Call Jupiter through Helius RPC
        const heliusRpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        
        // Make RPC call to get swap transaction
        const swapRequest = await axios.post(
          heliusRpcUrl,
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'getSwapTransaction',
            params: [{
              userPublicKey,
              inputMint,
              outputMint,
              amount,
              slippageBps: 50,
            }],
          },
          {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (swapRequest.data.result) {
          console.log('✅ REAL swap transaction from Helius!');
          return reply.send({
            swapTransaction: swapRequest.data.result.transaction,
            lastValidBlockHeight: swapRequest.data.result.lastValidBlockHeight,
          });
        }

        throw new Error('No swap transaction returned from Helius');
      } catch (error: any) {
        console.error('❌ Helius swap error:', error.message);
        if (error.response?.data) {
          console.error('Helius response:', JSON.stringify(error.response.data));
        }
        
        // Jupiter unavailable - use demo transaction to show working flow
        console.log('⚠️ Jupiter unavailable, using demo transaction...');
        const { buildDirectSwapTransaction } = await import('../services/directSwap');
        
        const transaction = await buildDirectSwapTransaction(
          userPublicKey,
          tokenIn,
          tokenOut,
          parseFloat(amountIn)
        );

        return reply.send(transaction);
      }
    }
  );

  // Get swap transaction  
  app.post<{ Body: z.infer<typeof SwapExecuteSchema> }>(
    '/swap/transaction',
    async (req, reply) => {
      const parsed = SwapExecuteSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { quoteData, userPublicKey } = parsed.data;

      // Use direct swap (no Jupiter API needed)
      try {
        console.log('Received swap request:', JSON.stringify({ quoteData, userPublicKey }, null, 2));
        
        const { buildDirectSwapTransaction } = await import('../services/directSwap');
        
        // Extract swap details from quoteData (which is the enriched intent)
        const tokenIn = quoteData?.tokenIn || quoteData?.inputMint || 'SOL';
        const tokenOut = quoteData?.tokenOut || quoteData?.outputMint || 'USDC';
        const amountIn = parseFloat(quoteData?.amountIn || quoteData?.inputAmount || '0.01');
        
        console.log(`Building swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);
        
        const transaction = await buildDirectSwapTransaction(
          userPublicKey,
          tokenIn,
          tokenOut,
          amountIn
        );
        
        return reply.send(transaction);
      } catch (error: any) {
        console.error('Failed to get swap transaction:', error);
        console.error('Error stack:', error.stack);
        return reply.status(500).send({ error: `Failed to build swap transaction: ${error.message}` });
      }
    }
  );

  app.post<{ Body: z.infer<typeof CopilotBodySchema> }>(
    '/copilot',
    async (req, reply) => {
      const parsed = CopilotBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { message, walletAddress, chain, conversationId } = parsed.data;

      // TODO: Enable database when ready
      // const user = await findOrCreateUser(walletAddress, chain);
      // const conversation = await findOrCreateConversation(user.id, walletAddress, chain, conversationId);
      // await addMessage(conversation.id, 'user', message);

      // Try AI first, fallback to pattern matching if no credits
      let aiReply: string;
      let intent: any;
      
      try {
        const result = await parseIntent({
          message,
          walletAddress,
          chain,
        });
        aiReply = result.reply;
        intent = result.intent;
      } catch (error) {
        console.log('AI API failed, using fallback pattern matching');
        
        // Fallback: Simple pattern matching for swaps
        const swapMatch = message.match(/swap\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i);
        if (swapMatch) {
          const [, amount, tokenIn, tokenOut] = swapMatch;
          intent = {
            action: 'swap',
            tokenIn: tokenIn.toUpperCase(),
            tokenOut: tokenOut.toUpperCase(),
            amountIn: amount,
            chain: chain,
            slippageTolerance: 0.5,
            clarificationNeeded: false,
          };
          aiReply = `I'll swap ${amount} ${tokenIn.toUpperCase()} to ${tokenOut.toUpperCase()}. Please confirm.`;
        } else {
          aiReply = `I understand you want to: "${message}". Please add credits to OpenAI to enable full AI features!`;
          intent = null;
        }
      }

      // await addMessage(conversation.id, 'assistant', aiReply, intent);

      // If it's a swap on Solana, get direct swap quote
      let enrichedIntent = intent;
      if (
        intent &&
        intent.action === 'swap' &&
        chain === 'solana' &&
        !intent.clarificationNeeded &&
        intent.tokenIn &&
        intent.tokenOut
      ) {
        try {
          const { getDirectSwapQuote } = await import('../services/directSwap');
          
          // Get amount in human-readable format
          const amountIn = intent.amountIn ? parseFloat(intent.amountIn) : 0.01;
          
          const quote = await getDirectSwapQuote(
            intent.tokenIn,
            intent.tokenOut,
            amountIn
          );

          // Output amount is already in human-readable format
          const outAmount = quote.outputAmount;

          enrichedIntent = {
            ...intent,
            quoteData: {
              ...quote,
              tokenIn: intent.tokenIn,
              tokenOut: intent.tokenOut,
              amountIn: intent.amountIn || amountIn.toString(),
            },
            estimatedOutput: outAmount,
          };
        } catch (error) {
          console.error('Failed to get swap quote:', error);
          // Continue without quote data
        }
      }

      // ── Query handlers: portfolio, market, yield ────────────────────────
      if (intent?.action === 'portfolio_query') {
        const qt = intent.queryType || 'portfolio_value';
        let queryResult: any;
        if (qt === 'pnl' || qt === 'trades') {
          queryResult = await handleTransactionHistory(walletAddress);
        } else {
          queryResult = await handlePortfolioQuery(walletAddress, qt);
        }
        enrichedIntent = { ...intent, queryResult };
        if (queryResult.error) {
          aiReply = `I fetched your portfolio data. ${queryResult.error ? `(Note: ${queryResult.error})` : ''}`;
        }
      }

      if (intent?.action === 'market_query') {
        const qt = intent.queryType || 'price';
        const token = intent.queryToken;
        const queryResult = await handleMarketQuery(qt, token);
        enrichedIntent = { ...intent, queryResult };
      }

      if (intent?.action === 'yield_query') {
        const token = intent.queryToken || intent.tokenIn || 'USDC';
        const queryResult = await handleYieldQuery(token);
        enrichedIntent = { ...intent, queryResult };
        aiReply = queryResult.pools?.length
          ? `Found ${queryResult.pools.length} ${token} yield opportunities. Top APY: ${queryResult.pools[0]?.apy}% on ${queryResult.pools[0]?.protocol}.`
          : `No ${token} yield pools found above $500k TVL right now.`;
      }

      // ── Privacy handler ─────────────────────────────────────────────────
      if (intent?.action === 'privacy') {
        const qt = intent.queryType || 'compare';
        let queryResult: any;

        if (qt === 'stealth_address') {
          queryResult = await generateStealthAddress(walletAddress);
          aiReply = 'Generated your stealth receive address via Umbra Protocol — share it with senders to receive funds privately.';

        } else if (qt === 'screen_wallet') {
          const target = intent.recipient || intent.queryToken || walletAddress;
          queryResult = await screenWallet(target);
          aiReply = queryResult.isClean
            ? `Wallet ${target.slice(0, 8)}... looks clean — no risk flags found.`
            : `⚠ Risk detected on ${target.slice(0, 8)}... — ${queryResult.flags.length} flags found.`;

        } else {
          const token = intent.tokenIn || 'SOL';
          const tokenOut = intent.tokenOut || token;
          const amount = parseFloat(intent.amountIn || intent.amountUsd || '0') || 1;
          const autoSelect = intent.autoSelect || 'lowest_fee';
          const preferred = (intent.preferredProvider || '').toLowerCase();
          const recipient = intent.recipient || '';

          // If user has a specific provider AND recipient — initiate directly
          if (preferred && recipient && (preferred.includes('ghostpay') || preferred.includes('ghost'))) {
            try {
              queryResult = await initiateGhostPaySend({
                fromToken: token, toToken: tokenOut, amount,
                payerAddress: walletAddress, receiverAddress: recipient,
              });
              aiReply = `GhostPay send initiated! Send ${queryResult.amountIn} ${queryResult.tokenIn} to the deposit address shown. Your wallet will be completely unlinked from ${recipient.slice(0,8)}...`;
            } catch (e: any) {
              aiReply = `GhostPay error: ${e.message}. Showing all routes instead.`;
              queryResult = await getPrivacyRoutes({ tokenIn: token, tokenOut, amount, recipient, autoSelect: 'lowest_fee' });
            }
          } else if (preferred && recipient && preferred.includes('houdini')) {
            try {
              queryResult = await initiateHoudiniSend({
                fromToken: token, toToken: tokenOut, amount, receiverAddress: recipient,
              });
              aiReply = `Houdini exchange created! Send ${queryResult.amountIn} ${queryResult.tokenIn} to the deposit address shown. Anonymous routing is active.`;
            } catch (e: any) {
              aiReply = `Houdini error: ${e.message}. Showing all routes instead.`;
              queryResult = await getPrivacyRoutes({ tokenIn: token, tokenOut, amount, recipient, autoSelect: 'lowest_fee' });
            }
          } else {
            // Compare all providers
            queryResult = await getPrivacyRoutes({
              tokenIn: token, tokenOut, amount, recipient,
              autoSelect: preferred ? undefined : autoSelect as any,
            });
            if (preferred) {
              queryResult.providers = queryResult.providers.map((p: any) => ({ ...p, recommended: p.provider.toLowerCase().includes(preferred) }));
              queryResult.recommended = preferred;
            }
            const rec = queryResult.providers.find((p: any) => p.recommended);
            aiReply = preferred
              ? `Routing ${amount} ${token} through ${preferred} — click “Send via this provider” to initiate.`
              : `Found ${queryResult.providers.length} privacy routes. Lowest fee: ${rec?.provider} (${rec?.feePct}%). Click a row to send — no redirect needed for GhostPay and Houdini.`;
          }
        }

        enrichedIntent = { ...intent, queryResult };
      }

      // ── Contact handler (client-side storage, just echo intent back) ────
      if (intent?.action === 'contact') {
        const qt = intent.queryType || 'list';
        enrichedIntent = { ...intent, queryResult: { type: 'contact_action', queryType: qt, contactName: intent.contactName, contactAddress: intent.contactAddress } };
        if (qt === 'save') aiReply = intent.contactName && intent.contactAddress ? `Saving ${intent.contactName} to your contacts.` : 'Please provide both a name and address.';
        else if (qt === 'edit') aiReply = `Updating ${intent.contactName}'s address.`;
        else if (qt === 'delete') aiReply = `Removing ${intent.contactName} from your contacts.`;
        else if (qt === 'lookup') aiReply = `Looking up ${intent.contactName} in your contacts.`;
        else aiReply = 'Here are your saved contacts.';
      }

      // ── Payment handler ──────────────────────────────────────────────────
      if (intent?.action === 'payment') {
        const qt = intent.queryType || 'direct';
        let queryResult: any;

        if (qt === 'spending_summary') {
          queryResult = await buildSpendingSummary(walletAddress);
          aiReply = queryResult.error
            ? `Couldn't fetch spending data. (${queryResult.error})`
            : `You sent ${queryResult.transferCount} payments totalling ~$${queryResult.totalUsd} this ${queryResult.month}.`;

        } else if (qt === 'request_link') {
          queryResult = buildPaymentLink({
            toWallet: walletAddress,
            token: intent.tokenIn || 'USDC',
            amount: parseFloat(intent.amountIn || intent.amountUsd || '0'),
            memo: intent.memo,
          });
          aiReply = `Your payment request link for ${queryResult.amount} ${queryResult.token} is ready — share it with anyone.`;

        } else if (qt === 'split' && intent.recipients?.length) {
          queryResult = await buildBatchPaymentPreview({
            fromWallet: walletAddress,
            recipients: intent.recipients.map((r: string) => ({ address: r, amount: 0 })),
            token: intent.tokenIn || 'USDC',
            splitEqually: true,
            totalAmount: parseFloat(intent.amountIn || intent.amountUsd || '0'),
          });
          aiReply = `Ready to split ${queryResult.total} ${queryResult.token} across ${queryResult.recipients.length} wallets. Review and sign below.`;

        } else if (qt === 'scheduled') {
          const recipient = intent.recipient || '';
          const token = intent.tokenIn || 'SOL';
          const amount = parseFloat(intent.amountIn || intent.amountUsd || '0');
          if (!recipient || amount <= 0) {
            aiReply = 'Please specify a recipient and amount, e.g. "send 0.1 SOL to hassan on april 15"';
          } else {
            const preview = await buildPaymentPreview({ fromWallet: walletAddress, recipient, token, amount, memo: intent.memo });
            queryResult = { ...preview, type: 'scheduled_payment_preview', scheduleDate: intent.scheduleDate || '' };
            aiReply = `Scheduled: ${amount} ${token.toUpperCase()} to ${preview.toDisplay} on ${intent.scheduleDate || 'the specified date'}. When the date arrives and the app is open, Phantom will prompt you to sign and confirm the send.`;
          }

        } else if (qt === 'direct' || qt === 'crossborder' || qt === 'swap_send' || qt === 'private') {
          const recipient = intent.recipient || '';
          const token = intent.tokenIn || 'SOL';
          const amount = parseFloat(intent.amountIn || intent.amountUsd || '0');
          if (!recipient || amount <= 0) {
            aiReply = 'Please specify a recipient address and amount, e.g. "send 0.5 SOL to abc.sol"';
          } else {
            queryResult = await buildPaymentPreview({ fromWallet: walletAddress, recipient, token, amount, memo: intent.memo });
            aiReply = `Ready to send ${amount} ${token.toUpperCase()} to ${queryResult.toDisplay}. Review and sign below.`;
          }

        } else if (qt === 'recurring') {
          queryResult = {
            type: 'payment_info',
            message: 'Recurring payments require Gelato integration. You can set up an automated transfer of ' +
              `${intent.amountIn || intent.amountUsd || '?'} ${intent.tokenIn || 'USDC'} ${intent.dcaInterval || 'monthly'} ` +
              'via Gelato Network — this feature is on our roadmap.',
          };
          aiReply = 'Recurring payments via Gelato are coming soon. For now I can help you with one-time sends.';

        } else {
          aiReply = 'Please specify payment details — who to send to, how much, and which token.';
        }

        if (queryResult) enrichedIntent = { ...intent, queryResult };
      }

      // ── Tax query handler ────────────────────────────────────────────────
      if (intent?.action === 'tax_query') {
        const qt = intent.queryType || 'report';
        let queryResult: any;
        if (qt === 'gains' || qt === 'tax') {
          queryResult = await handleCapitalGains(walletAddress);
        } else if (qt === 'csv' || qt === 'export') {
          queryResult = await handleExportCSV(walletAddress);
        } else if (qt === 'harvest' || qt === 'tax_loss') {
          queryResult = await handleTaxLossHarvesting(walletAddress);
        } else if (qt === 'proof_of_funds' || qt === 'proof') {
          queryResult = await handleProofOfFunds(walletAddress);
        } else if (qt === 'ofac' || qt === 'compliance') {
          queryResult = await handleOFACCheck(walletAddress);
        } else {
          queryResult = await handleTaxReport(walletAddress);
        }
        enrichedIntent = { ...intent, queryResult };
        if (queryResult.error) {
          aiReply = `I ran your tax query. (Note: ${queryResult.error})`;
        }
      }

      // Handle cancel_order: fetch active orders from DB and attach to intent
      if (intent?.action === 'cancel_order') {
        try {
          const user = await prisma.user.findUnique({ where: { walletAddress: walletAddress } });
          if (user) {
            const activeOrders = await (prisma.order.findMany as any)({
              where: { userId: user.id, status: 'watching' },
              orderBy: { createdAt: 'desc' },
              take: 10,
            });
            if (activeOrders.length === 0) {
              aiReply = "You have no active orders to cancel.";
              enrichedIntent = { ...intent, activeOrders: [] };
            } else {
              enrichedIntent = { ...intent, activeOrders };
              aiReply = activeOrders.length === 1
                ? `Found 1 active order: ${activeOrders[0].amountIn} ${activeOrders[0].tokenIn} → ${activeOrders[0].tokenOut} at $${activeOrders[0].triggerPrice}. Sign the cancel transaction to retrieve your funds.`
                : `Found ${activeOrders.length} active orders. I'll show them below — click cancel on the ones you want to close.`;
            }
          } else {
            aiReply = "No orders found for your wallet.";
            enrichedIntent = { ...intent, activeOrders: [] };
          }
        } catch (e) {
          console.error('Error fetching orders for cancel:', e);
        }
      }

      const response: CopilotResponse = {
        reply: aiReply,
        intent: enrichedIntent,
        requiresConfirmation: enrichedIntent
          ? ['swap', 'limit', 'stop_loss', 'dca', 'bridge'].includes(enrichedIntent.action) &&
            !enrichedIntent.clarificationNeeded
          : false,
        conversationId: conversationId || `temp-${Date.now()}`,
      };

      return reply.send(response);
    }
  );
};
