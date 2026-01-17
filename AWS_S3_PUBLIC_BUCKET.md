# AWS S3 Setup - Make Bucket Public

## ✅ Step 1: Add Bucket Policy (Make Images Public)

Your bucket `iskcon-storage` blocks ACLs, so we need to use a **bucket policy** to make uploaded images public.

### Instructions:

1. **Go to S3 Console**
   - Open [S3 Console](https://s3.console.aws.amazon.com/s3/)
   - Click on bucket: `iskcon-storage`

2. **Add Bucket Policy**
   - Click **Permissions** tab
   - Scroll to **Bucket policy** section
   - Click **Edit**

3. **Paste This Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iskcon-storage/*"
    }
  ]
}
```

4. **Click "Save changes"**

### What This Does:
- Allows anyone to **view** (GetObject) uploaded images
- Only you can **upload** (PutObject) via IAM credentials
- Images will be publicly accessible at their URLs

---

## ✅ Step 2: Verify Block Public Access Settings

1. In **Permissions** tab, find **Block public access (bucket settings)**
2. Click **Edit**
3. **Uncheck** "Block all public access"
4. Click **Save changes**
5. Type `confirm` when prompted

---

## 🎯 Test It

After making these changes:
1. Go back to `/admin/slideshow`
2. Try uploading an image
3. You should see: ✅ "Image uploaded successfully"
4. The image URL will work in the browser

---

## ⚠️ Troubleshooting

### If you still get errors:

**"Access Denied"**
- Go to IAM → Users → `iskconburla-manager`
- Make sure `AmazonS3FullAccess` policy is attached
- OR use the custom policy from the original AWS_FIX.md

**"Bucket policy has invalid resource"**
- Make sure bucket name in policy matches: `iskcon-storage`
- Resource should be: `arn:aws:s3:::iskcon-storage/*` (with `/*` at end)

**Images not loading**
- Check bucket policy is saved
- Check "Block public access" is turned OFF
- Wait 30 seconds for changes to propagate
