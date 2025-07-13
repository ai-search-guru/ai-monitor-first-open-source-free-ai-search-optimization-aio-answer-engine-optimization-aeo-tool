# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### ChunkLoadError

**Error**: `ChunkLoadError` during development or production

**Symptoms**:
- Webpack chunk loading failures
- `__webpack_require__.f.j` errors
- Page fails to load completely

**Solutions**:

1. **Clear Build Cache** (Most Common Fix)
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run dev
   ```

2. **Check for Port Conflicts**
   ```bash
   # Kill all Node.js processes
   taskkill /f /im node.exe    # Windows
   killall node               # macOS/Linux
   
   # Start fresh
   npm run dev
   ```

3. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

4. **Check Dynamic Imports**
   - Ensure all dynamic imports are properly structured
   - Verify component exports are correct

### EPERM Errors (Windows)

**Error**: `EPERM: operation not permitted, open '.next\trace'`

**Solutions**:

1. **Run as Administrator**
   - Right-click terminal/command prompt
   - Select "Run as administrator"

2. **Disable Antivirus Scanning**
   - Temporarily disable real-time scanning
   - Add project folder to antivirus exclusions

3. **Clear File Locks**
   ```bash
   # Stop all Node processes
   taskkill /f /im node.exe
   
   # Delete .next directory
   rmdir /s /q .next
   
   # Restart development server
   npm run dev
   ```

### Authentication Issues

**Error**: Infinite redirects or authentication loops

**Solutions**:

1. **Check Firebase Configuration**
   ```bash
   # Verify environment variables
   echo $NEXT_PUBLIC_FIREBASE_API_KEY
   ```

2. **Clear Browser Storage**
   - Clear localStorage and sessionStorage
   - Clear cookies for localhost
   - Try incognito/private mode

3. **Check AuthContext**
   - Verify AuthContext is properly wrapped
   - Check for multiple AuthContext providers

### Component Import Errors

**Error**: `Cannot read properties of undefined (reading 'definition')`

**Solutions**:

1. **Check Component Exports**
   ```tsx
   // Ensure proper default export
   export default function MyComponent() {
     return <div>Content</div>;
   }
   ```

2. **Verify Import Paths**
   ```tsx
   // Use absolute imports
   import Component from '@/components/Component';
   // Instead of relative imports
   import Component from '../../../Component';
   ```

3. **Check for Circular Dependencies**
   - Review import chains
   - Use dependency graph tools if needed

### Firestore Permission Errors

**Error**: `permission-denied` when accessing Firestore

**Solutions**:

1. **Update Firestore Rules**
   ```javascript
   // Development rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Check Authentication**
   - Verify user is signed in
   - Check auth token validity

3. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Build/Compilation Errors

**Error**: Build fails with module resolution errors

**Solutions**:

1. **Check TypeScript Configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. **Verify File Extensions**
   - Use `.tsx` for React components
   - Use `.ts` for utility files

3. **Check Import Syntax**
   ```tsx
   // Correct
   import { Component } from './Component';
   
   // Incorrect
   import Component from './Component';
   ```

## 🔧 Emergency Reset

If all else fails, perform a complete reset:

```bash
# 1. Stop all processes
taskkill /f /im node.exe        # Windows
killall node                   # macOS/Linux

# 2. Clean everything
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.cache

# 3. Reinstall dependencies
npm install

# 4. Start fresh
npm run dev
```

## 🐛 Debug Tools

### Enable Debug Logging

Add to your component:
```tsx
useEffect(() => {
  console.log('Debug Info:', {
    user: user?.email,
    brands: brands.length,
    selectedBrand: selectedBrand?.companyName
  });
}, [user, brands, selectedBrand]);
```

### Browser Developer Tools

1. **Network Tab**: Check for failed chunk requests
2. **Console Tab**: Look for JavaScript errors
3. **Application Tab**: Check localStorage/sessionStorage
4. **Sources Tab**: Verify file loading

### Next.js Debug Mode

```bash
# Start with debug logging
DEBUG=* npm run dev

# Or specific debug categories
DEBUG=next:* npm run dev
```

## 📞 Getting Help

If issues persist:

1. **Check Browser Console** for detailed error messages
2. **Review Terminal Output** for build errors
3. **Test in Incognito Mode** to rule out cache issues
4. **Try Different Browser** to isolate browser-specific issues
5. **Check Firebase Console** for authentication/database issues

Remember to check the specific error message in the browser console for more detailed information about what's causing the ChunkLoadError. 