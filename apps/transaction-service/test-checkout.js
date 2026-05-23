const { createClient } = require('@supabase/supabase-js');

async function runTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase variables in container environment.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Query transaction_items table first to guarantee we select a transaction with items!
  const { data: item, error: itemErr } = await supabase
    .from('transaction_items')
    .select('transaction_id')
    .limit(1)
    .single();

  if (itemErr || !item) {
    console.warn('⚠️ No items found in transaction_items. Trying to fetch first raw transaction...');
  }

  let transactionId;
  if (item && item.transaction_id) {
    transactionId = item.transaction_id;
  } else {
    // Fallback to first transaction
    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select('id')
      .limit(1)
      .single();

    if (txnErr || !txn) {
      console.error('❌ No transactions found in database.');
      return;
    }
    transactionId = txn.id;
  }

  console.log(`\n🔍 Using Transaction ID: ${transactionId}`);

  // 2. Call our checkout endpoint
  console.log('📡 Requesting checkout session from transaction-service...');
  try {
    const response = await fetch(`http://localhost:4007/transactions/${transactionId}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        paymentMethods: ['gcash', 'maya', 'card']
      })
    });

    const result = await response.json();
    console.log(`\n🎉 Gateway Response Status: ${response.status}`);
    console.log('📦 Response JSON Body:');
    console.log(JSON.stringify(result, null, 2));

    if (result.checkoutUrl) {
      console.log('\n✅ TEST SUCCESSFUL!');
      console.log(`🔗 Click here to test checkout session in browser: ${result.checkoutUrl}\n`);
    } else {
      console.log('\n❌ Failed to generate checkoutUrl. Check errors above.');
    }
  } catch (err) {
    console.error('❌ Request to transaction-service failed:', err.message);
  }
}

runTest();
