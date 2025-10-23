# 🧪 Secure Cancellation Testing Guide

## Quick Start Testing

### Prerequisites
1. ✅ Backend server running
2. ✅ Frontend server running (`ng serve`)
3. ✅ Email service configured
4. ✅ At least one test booking created

---

## Test Scenarios

### ✅ Scenario 1: Successful Cancellation (Happy Path)

**Steps**:
1. Navigate to booking lookup: `http://localhost:4200/booking-lookup`
2. Enter a valid booking serial key (e.g., `EVT-20251005-ABC123`)
3. Click "Find Booking"
4. Verify booking details are displayed
5. Click "Request Cancellation" button
6. **Should redirect to**: `/booking-cancel/:bookingId`
7. Enter the guest email address
8. Click "Send Code"
9. Check email inbox for verification code
10. Enter the 6-digit code
11. Click "Confirm Cancellation"
12. **Expected**: Success message + auto-redirect after 3 seconds
13. **Verify**: Booking status changed to "cancelled"
14. **Verify**: Confirmation email received

**Expected Results**:
- ✅ Redirected to cancellation page
- ✅ Email sent with 6-digit code
- ✅ Code accepted
- ✅ Booking cancelled
- ✅ Confirmation email sent
- ✅ Auto-redirect to booking lookup

---

### ❌ Scenario 2: Wrong Email Address

**Steps**:
1. Navigate to cancellation page
2. Enter **incorrect** email (not matching booking)
3. Click "Send Code"

**Expected Results**:
- ❌ Error message: "Email does not match booking"
- ❌ No code sent
- ⏸️ Stays on email step

---

### ❌ Scenario 3: Invalid Verification Code

**Steps**:
1. Complete email step successfully
2. Enter **wrong** 6-digit code (e.g., `000000`)
3. Click "Confirm Cancellation"

**Expected Results**:
- ❌ Error message: "Invalid verification code. 2 attempt(s) remaining."
- ⏸️ Stays on code step
- ℹ️ Can retry 2 more times

**Continue Testing**:
4. Enter wrong code again
5. **Expected**: "Invalid verification code. 1 attempt(s) remaining."
6. Enter wrong code third time
7. **Expected**: "Too many failed attempts. Please request a new code."
8. Must go back and request new code

---

### ⏰ Scenario 4: Expired Code

**Steps**:
1. Complete email step successfully
2. **Wait 16 minutes** (code expires after 15 minutes)
3. Enter the code (even if correct)
4. Click "Confirm Cancellation"

**Expected Results**:
- ❌ Error message: "Verification code has expired. Please request a new code."
- ⏸️ Must request new code

---

### 🔄 Scenario 5: Resend Code

**Steps**:
1. Complete email step successfully
2. On code entry step, click "Resend Code"

**Expected Results**:
- ✅ New code generated
- ✅ New email sent
- ✅ Old code invalidated
- ℹ️ Code input cleared
- ⏰ New 15-minute timer starts

---

### 🚫 Scenario 6: Already Cancelled Booking

**Steps**:
1. Use a booking that's already cancelled
2. Try to request cancellation

**Expected Results**:
- ❌ Error message: "Booking is already cancelled"
- ❌ No code sent

---

### 🚫 Scenario 7: Completed Booking

**Steps**:
1. Use a booking with status "completed"
2. Try to request cancellation

**Expected Results**:
- ❌ Error message: "Cannot cancel a completed booking"
- ❌ No code sent

---

### 🔙 Scenario 8: Cancel Process

**Steps**:
1. Start cancellation process
2. On email step, click "Cancel" button

**Expected Results**:
- ✅ Redirected back to booking lookup
- ℹ️ No code sent
- ℹ️ Booking unchanged

---

## Backend API Testing (Using Postman/cURL)

### Test 1: Request Cancellation

```bash
curl -X POST http://localhost:3000/bookings/cancel/request \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "YOUR_BOOKING_ID",
    "guestEmail": "guest@example.com"
  }'
```

**Expected Response (200)**:
```json
{
  "message": "Verification code sent to guest@example.com. Please check your email."
}
```

**Check Backend Logs**:
```
[BookingCancellationService] Cancellation code generated for booking XXX: 123456
[BookingNotificationService] Cancellation code sent to guest@example.com
```

---

### Test 2: Verify Cancellation

```bash
curl -X POST http://localhost:3000/bookings/cancel/verify \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "YOUR_BOOKING_ID",
    "guestEmail": "guest@example.com",
    "verificationCode": "123456"
  }'
```

**Expected Response (200)**:
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "...",
    "status": "cancelled",
    ...
  }
}
```

---

## Email Testing

### Check Verification Code Email

**Subject**: Booking Cancellation - Verification Code

**Content Should Include**:
- ✅ Guest name
- ✅ Booking serial key
- ✅ 6-digit code (large, centered)
- ✅ Expiry time (15 minutes)
- ✅ Security notice

### Check Confirmation Email

**Subject**: Booking Cancellation Confirmed

**Content Should Include**:
- ✅ Guest name
- ✅ Booking serial key
- ✅ Original booking date/time
- ✅ Rebooking link/message

---

## Browser Console Testing

### Check for Errors

Open browser console (F12) and verify:
- ✅ No JavaScript errors
- ✅ No 404 errors
- ✅ API calls successful (200 status)
- ✅ Proper navigation

### Network Tab

Monitor API calls:
1. **POST** `/bookings/cancel/request` → 200 OK
2. **POST** `/bookings/cancel/verify` → 200 OK

---

## Database Verification

### Check Booking Status

```javascript
// MongoDB Shell
db.bookings.findOne({ _id: ObjectId("YOUR_BOOKING_ID") })

// Verify:
// - status: "cancelled"
// - updatedAt: recent timestamp
```

---

## Performance Testing

### Load Test Cancellation Endpoint

```bash
# Using Apache Bench
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:3000/bookings/cancel/request
```

**Monitor**:
- Response times
- Error rates
- Memory usage
- Code cleanup performance

---

## Security Testing

### Test 1: Brute Force Protection

**Steps**:
1. Request cancellation code
2. Try 10 different codes rapidly

**Expected**:
- ❌ Blocked after 3 attempts
- ℹ️ Must request new code

### Test 2: Code Reuse

**Steps**:
1. Request code
2. Use code successfully
3. Try to use same code again

**Expected**:
- ❌ Code already used/deleted
- ❌ Error message

### Test 3: Expired Code Cleanup

**Steps**:
1. Request multiple codes
2. Wait 20 minutes
3. Check backend logs

**Expected**:
- ✅ Log: "Cleaned up X expired cancellation codes"
- ℹ️ Runs every 5 minutes

---

## UI/UX Testing

### Responsive Design

Test on:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

### Accessibility

- ✅ Tab navigation works
- ✅ Screen reader compatible
- ✅ Error messages are clear
- ✅ Loading states visible

### Material Design

- ✅ Stepper works correctly
- ✅ Form validation displays properly
- ✅ Icons load correctly
- ✅ Colors match theme

---

## Common Issues & Solutions

### Issue 1: Email Not Received

**Possible Causes**:
- Email service not configured
- Wrong email address
- Spam folder

**Solution**:
- Check backend logs for email errors
- Verify email service configuration
- Check spam/junk folder

### Issue 2: Code Not Working

**Possible Causes**:
- Code expired (>15 minutes)
- Too many attempts (>3)
- Wrong code entered

**Solution**:
- Request new code
- Check email for correct code
- Verify code hasn't expired

### Issue 3: Navigation Not Working

**Possible Causes**:
- Route not registered
- Component not loaded
- Router state issue

**Solution**:
- Verify route in `app.routes.ts`
- Check browser console for errors
- Clear browser cache

---

## Test Checklist

### Backend Tests
- [ ] Request cancellation with valid data
- [ ] Request cancellation with invalid email
- [ ] Request cancellation for non-existent booking
- [ ] Request cancellation for cancelled booking
- [ ] Request cancellation for completed booking
- [ ] Verify with correct code
- [ ] Verify with wrong code (3 attempts)
- [ ] Verify with expired code
- [ ] Test code cleanup
- [ ] Test concurrent requests

### Frontend Tests
- [ ] Navigate to cancellation page
- [ ] Email validation
- [ ] Code validation
- [ ] Request code flow
- [ ] Verify code flow
- [ ] Error handling
- [ ] Success flow
- [ ] Resend code
- [ ] Cancel process
- [ ] Auto-redirect

### Integration Tests
- [ ] End-to-end cancellation
- [ ] Email delivery
- [ ] Code expiration
- [ ] Multiple attempts
- [ ] Concurrent users

### UI/UX Tests
- [ ] Responsive design
- [ ] Accessibility
- [ ] Loading states
- [ ] Error messages
- [ ] Success messages

---

## Quick Test Script

```bash
#!/bin/bash
# Quick test script for cancellation flow

BOOKING_ID="YOUR_BOOKING_ID"
EMAIL="guest@example.com"
API_URL="http://localhost:3000"

echo "1. Requesting cancellation..."
RESPONSE=$(curl -s -X POST $API_URL/bookings/cancel/request \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"$BOOKING_ID\",\"guestEmail\":\"$EMAIL\"}")
echo $RESPONSE

echo "\n2. Check your email for the code"
read -p "Enter the 6-digit code: " CODE

echo "\n3. Verifying cancellation..."
RESPONSE=$(curl -s -X POST $API_URL/bookings/cancel/verify \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"$BOOKING_ID\",\"guestEmail\":\"$EMAIL\",\"verificationCode\":\"$CODE\"}")
echo $RESPONSE

echo "\n✅ Test complete!"
```

---

## Success Criteria

### All Tests Pass When:
- ✅ Cancellation flow completes successfully
- ✅ Emails are sent and received
- ✅ Codes expire after 15 minutes
- ✅ Attempt limiting works (max 3)
- ✅ Invalid emails are rejected
- ✅ Already cancelled bookings are rejected
- ✅ UI is responsive and accessible
- ✅ No console errors
- ✅ Proper error messages displayed
- ✅ Auto-redirect works

---

**Happy Testing! 🎉**
