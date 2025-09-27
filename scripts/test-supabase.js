#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and basic operations
 * Run with: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if contacts table exists
    console.log('1. Testing table access...');
    const { data, error } = await supabase
      .from('contacts')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Table access failed:', error.message);
      return false;
    }
    console.log('✅ Contacts table is accessible');

    // Test 2: Insert a test contact
    console.log('\n2. Testing contact creation...');
    const testContact = {
      name: 'Test Contact',
      image_url: 'https://via.placeholder.com/150',
      last_contact_date: '2024-01-01',
      email: 'test@example.com',
      phone: '+1234567890'
    };

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert([testContact])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Contact creation failed:', insertError.message);
      return false;
    }
    console.log('✅ Contact created successfully:', newContact.id);

    // Test 3: Read the contact
    console.log('\n3. Testing contact retrieval...');
    const { data: retrievedContact, error: selectError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', newContact.id)
      .single();

    if (selectError) {
      console.error('❌ Contact retrieval failed:', selectError.message);
      return false;
    }
    console.log('✅ Contact retrieved successfully');

    // Test 4: Update the contact
    console.log('\n4. Testing contact update...');
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({ name: 'Updated Test Contact' })
      .eq('id', newContact.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Contact update failed:', updateError.message);
      return false;
    }
    console.log('✅ Contact updated successfully');

    // Test 5: Search functionality
    console.log('\n5. Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
      .from('contacts')
      .select('*')
      .ilike('name', '%Test%');

    if (searchError) {
      console.error('❌ Search failed:', searchError.message);
      return false;
    }
    console.log('✅ Search functionality working');

    // Test 6: Delete the test contact
    console.log('\n6. Testing contact deletion...');
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', newContact.id);

    if (deleteError) {
      console.error('❌ Contact deletion failed:', deleteError.message);
      return false;
    }
    console.log('✅ Contact deleted successfully');

    console.log('\n🎉 All tests passed! Supabase is properly configured and working.');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

