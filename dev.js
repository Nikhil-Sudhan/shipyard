// Development helper script for Shipyard

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env.local exists
const checkEnvFile = () => {
  if (!fs.existsSync('.env.local')) {
    console.log('\n❌ .env.local file not found!');
    console.log('Creating a template .env.local file...');
    
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key`;
    
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local template. Please edit it with your actual values.');
    return false;
  }
  return true;
};

// Main function
const main = async () => {
  console.log('🚀 Shipyard Development Helper');
  console.log('============================\n');
  
  // Check environment variables
  const envExists = checkEnvFile();
  if (!envExists) {
    console.log('\nPlease edit the .env.local file with your actual values, then run this script again.');
    rl.close();
    return;
  }
  
  console.log('Choose an option:');
  console.log('1. Start development server');
  console.log('2. Build the application');
  console.log('3. Run database schema check');
  console.log('4. Exit');
  
  rl.question('\nEnter your choice (1-4): ', (answer) => {
    switch(answer) {
      case '1':
        console.log('\n🚀 Starting development server...');
        try {
          execSync('npm run dev', { stdio: 'inherit' });
        } catch (error) {
          console.error('Error starting development server:', error);
        }
        break;
        
      case '2':
        console.log('\n🔨 Building the application...');
        try {
          execSync('npm run build', { stdio: 'inherit' });
          console.log('✅ Build completed successfully!');
        } catch (error) {
          console.error('Error building the application:', error);
        }
        break;
        
      case '3':
        console.log('\n🔍 Database schema check:');
        console.log('To run the database schema:');
        console.log('1. Go to your Supabase project');
        console.log('2. Open the SQL Editor');
        console.log('3. Copy and paste the contents of supabase-schema.sql');
        console.log('4. Run the query');
        break;
        
      case '4':
      default:
        console.log('\n👋 Goodbye!');
        break;
    }
    
    rl.close();
  });
};

main();
