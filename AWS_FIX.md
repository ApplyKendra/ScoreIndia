# AWS IAM Policy Fix for S3 Upload

## Problem
Your IAM user `iskconburla-manager` doesn't have permission to upload files to S3 bucket `iskcon-storage`.

## Solution

### Option 1: Add Policy via AWS Console (Recommended)

1. **Go to IAM Console**
   - Open [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Click **Users** → Find `iskconburla-manager`

2. **Add Permissions**
   - Click **Add permissions** → **Attach policies directly**
   - Search for and attach: `AmazonS3FullAccess`
   - **OR** create a custom policy (more secure - see below)

3. **Click "Add permissions"**

### Option 2: Create Custom Policy (More Secure)

1. Go to IAM → **Policies** → **Create policy**
2. Switch to **JSON** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::iskcon-storage/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::iskcon-storage"
    }
  ]
}
```

4. Name it: `IskconS3UploadPolicy`
5. Click **Create policy**
6. Go back to IAM Users → `iskconburla-manager` → **Add permissions**
7. Attach the `IskconS3UploadPolicy`

### Verify Bucket Exists

Make sure bucket `iskcon-storage` exists in region `ap-south-1`:
- Go to [S3 Console](https://s3.console.aws.amazon.com/s3/)
- Search for `iskcon-storage`
- If it doesn't exist, create it in `ap-south-1` region

### After Fixing

1. Wait ~30 seconds for IAM changes to propagate
2. Reload the admin slideshow page
3. Try uploading again - it should work!

## Error Messages

Now you'll see clear error messages in the browser console if there are issues:
- ❌ "AWS Permission Error: Your IAM user doesn't have permission..."
- ❌ "S3 bucket 'iskcon-storage' does not exist..."
- ✅ "Image uploaded successfully"
