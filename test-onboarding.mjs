// Test script for onboarding flow
// Run with Node.js to test API endpoints used in onboarding

import fetch from 'node-fetch';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base URL - change this to your development server
const BASE_URL = 'http://localhost:3000';

// Mock data for testing
const mockData = {
  profile: {
    display_name: 'Test User',
    location_city: 'San Francisco',
    location_country: 'USA',
    interests: ['coding', 'design', 'music'],
  },
  answers: {
    vibe_check: 'chill and creative',
    dream_project: 'building a social platform',
    coffee_order: 'iced oat milk latte',
    weekend_activity: 'coding and hiking',
    life_goal: 'create something meaningful'
  }
};

// Test functions
async function testProfileAnswers() {
  console.log('\n🧪 Testing profile answers API...');
  try {
    const response = await fetch(`${BASE_URL}/api/profile/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: mockData.answers }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return response.ok;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function testSummarize() {
  console.log('\n🧪 Testing summarize API...');
  try {
    const response = await fetch(`${BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: mockData.answers,
        interests: mockData.profile.interests
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return response.ok ? data : null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function testProfileSave(summary) {
  console.log('\n🧪 Testing profile save API...');
  try {
    const profileData = {
      ...mockData.profile,
      summary_intro: summary.intro,
      summary_outro: summary.outro,
      primary_photo_url: 'https://example.com/placeholder.jpg',
      extra_photo_urls: []
    };
    
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return response.ok;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function testProfileGet() {
  console.log('\n🧪 Testing profile get API...');
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return response.ok;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting onboarding flow tests');
  console.log('--------------------------------');
  console.log('NOTE: You must be logged in to Supabase for these tests to work.');
  console.log('Make sure your development server is running at', BASE_URL);
  
  rl.question('\nPress Enter to start tests or Ctrl+C to cancel...', async () => {
    // Test profile answers
    const answersSuccess = await testProfileAnswers();
    if (!answersSuccess) {
      console.log('❌ Profile answers test failed. Stopping tests.');
      rl.close();
      return;
    }
    
    // Test summarize
    const summary = await testSummarize();
    if (!summary) {
      console.log('❌ Summarize test failed. Stopping tests.');
      rl.close();
      return;
    }
    
    // Test profile save
    const profileSaveSuccess = await testProfileSave(summary);
    if (!profileSaveSuccess) {
      console.log('❌ Profile save test failed. Stopping tests.');
      rl.close();
      return;
    }
    
    // Test profile get
    const profileGetSuccess = await testProfileGet();
    if (!profileGetSuccess) {
      console.log('❌ Profile get test failed.');
    }
    
    console.log('\n--------------------------------');
    console.log('✅ All tests completed!');
    console.log('You can now test the full onboarding flow in the browser.');
    
    rl.close();
  });
}

runTests();
