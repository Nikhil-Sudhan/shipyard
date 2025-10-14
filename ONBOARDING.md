# Shipyard Onboarding Process

This document explains the onboarding flow in Shipyard, how it works, and how to troubleshoot common issues.

## Onboarding Flow Overview

The onboarding process consists of three main steps:

1. **Basic Information**: Users enter their display name, location, and interests
2. **Photo Upload**: Users upload a primary profile photo and optional extra photos
3. **Gen-Z Questions**: Users answer fun questions to generate a personalized profile summary

After completing these steps, the system:
1. Saves the user's answers
2. Generates a summary using OpenAI
3. Uploads the photos to Supabase Storage
4. Creates the user profile
5. Redirects to the user's profile page with a welcome message

## API Endpoints Used

The onboarding process uses several API endpoints:

- `POST /api/profile/answers` - Saves the user's answers to the Gen-Z questions
- `POST /api/summarize` - Generates a profile summary using OpenAI
- `POST /api/storage/upload` - Uploads photos to Supabase Storage
- `POST /api/profile` - Creates or updates the user's profile

## Troubleshooting Common Issues

### 1. Nothing happens when clicking "Finish Setup"

Possible causes:
- User is not authenticated with Supabase
- Network issues
- API errors

Solutions:
- Check browser console for errors
- Ensure user is logged in
- Check Supabase authentication status
- Verify environment variables are set correctly

### 2. Photos don't upload

Possible causes:
- Supabase storage bucket not configured correctly
- File size too large
- Network issues

Solutions:
- Check if 'profile-photos' bucket exists in Supabase
- Ensure RLS policies are set correctly
- Check browser console for upload errors
- Verify file formats (JPEG, PNG, etc.)

### 3. Summary generation fails

Possible causes:
- OpenAI API key missing or invalid
- Rate limiting
- Formatting issues

Solutions:
- Verify OPENAI_API_KEY environment variable
- Check OpenAI API usage and limits
- Review API response for error messages

### 4. Profile not saved

Possible causes:
- Database errors
- Missing required fields
- RLS policy issues

Solutions:
- Check Supabase logs for errors
- Verify all required fields are provided
- Ensure user has permission to create/update profile

## Testing the Onboarding Flow

We provide a test script to verify the API endpoints used in the onboarding process:

```bash
npm run test:onboarding
```

This script tests:
1. Saving profile answers
2. Generating a summary
3. Saving the profile
4. Retrieving the profile

For a complete end-to-end test, use the browser to go through the onboarding flow.

## Customizing the Onboarding Process

### Modifying Gen-Z Questions

Edit the `GEN_Z_QUESTIONS` array in `src/app/onboarding/page.tsx`:

```typescript
const GEN_Z_QUESTIONS = [
  {
    key: 'question_key',
    question: 'Your question text?',
    placeholder: 'Placeholder text'
  },
  // Add more questions...
];
```

### Changing the OpenAI Prompt

Edit the prompt in `src/app/api/summarize/route.ts` to modify how the summary is generated.

### Adding More Steps

To add more steps to the onboarding process:
1. Increment the max step number in the state
2. Add a new step component with its own form fields
3. Update the handleSubmit function to include the new data
4. Update the database schema if necessary
