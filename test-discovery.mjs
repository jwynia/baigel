#!/usr/bin/env node

// Test script to verify the discovery system works with the MCP server list
import fetch from 'node-fetch';

const TEST_URL = 'http://100.80.122.46:4111/api/mcp/v0/servers';

async function testDiscovery() {
  console.log('Testing MCP server discovery...');
  console.log(`Fetching: ${TEST_URL}`);
  
  try {
    const response = await fetch(TEST_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('\n=== Raw API Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    // Test our parsing logic
    if (data.servers && Array.isArray(data.servers)) {
      console.log('\n=== Parsed Servers ===');
      console.log(`Found ${data.servers.length} servers:`);
      
      data.servers.forEach((server, index) => {
        console.log(`\n${index + 1}. ${server.name || server.id}`);
        console.log(`   ID: ${server.id}`);
        console.log(`   Description: ${server.description || 'No description'}`);
        console.log(`   Version: ${server.version_detail?.version || 'Unknown'}`);
        console.log(`   Release Date: ${server.version_detail?.release_date || 'Unknown'}`);
      });
      
      console.log('\n=== Discovery Test Result ===');
      console.log(`✅ Successfully discovered ${data.servers.length} MCP servers`);
      console.log('The new parsing logic should create individual DiscoveredAgent entries for each server');
      
    } else {
      console.log('❌ No servers array found in response');
    }
    
  } catch (error) {
    console.error('❌ Discovery test failed:', error.message);
  }
}

testDiscovery();