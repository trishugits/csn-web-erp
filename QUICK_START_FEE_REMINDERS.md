# 🚀 Quick Start - Fee Reminders

## ✅ What's New

Admin can now **send email reminders** to students with unpaid fees!

---

## 📧 Two Ways to Send

### 1️⃣ Send to Selected
```
1. Select class
2. Check boxes next to students
3. Click "Send to Selected (X)"
4. Done! ✅
```

### 2️⃣ Send to All Unpaid
```
1. Select class
2. Click "Send to All Unpaid"
3. Confirm
4. Done! ✅
```

---

## 📋 Quick Steps

### Send Reminders:
1. Go to **Fees** → **Class Reports**
2. Select **Class** from dropdown
3. **Option A:** Check individual students
4. **Option B:** Click "Send to All Unpaid"
5. Wait for confirmation
6. See success message!

---

## 📧 Email Includes

```
✅ Student name and ID
✅ Class and session
✅ Payment period
✅ Amount due
✅ Amount paid
✅ Outstanding balance
✅ Due date
✅ Professional design
```

---

## 🎨 UI Quick View

```
┌────────────────────────────────────────┐
│ Class Reports                          │
│ [Class] [Period] [Send to All] [Send] │
├────────────────────────────────────────┤
│ [☑] Select All                         │
│ [☑] John Doe - ₹3,500 pending         │
│ [☑] Jane Smith - ₹7,000 pending       │
│ [ ] Bob Wilson - Paid ✓                │
└────────────────────────────────────────┘
```

---

## ⚙️ Setup Required

### Email Configuration (.env):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=school@example.com
```

### Gmail Setup:
1. Enable 2FA
2. Generate App Password
3. Use in SMTP_PASS

---

## ✅ Quick Checklist

**Before Sending:**
- [ ] SMTP configured in .env
- [ ] Students have email addresses
- [ ] Logged in as admin
- [ ] On Class Reports tab

**To Send:**
- [ ] Select class
- [ ] Check students OR click "Send to All"
- [ ] Click send button
- [ ] Wait for confirmation

---

## 💡 Pro Tips

**Tip 1:** Test First
Send to yourself first to verify email looks good.

**Tip 2:** Use Bulk for Monthly
Use "Send to All Unpaid" for monthly reminders.

**Tip 3:** Use Selected for Follow-ups
Select specific students for targeted reminders.

**Tip 4:** Check Spam
Tell students to check spam folder.

**Tip 5:** Space Reminders
Don't send daily - space them out appropriately.

---

## 📊 Response Messages

```
✅ "Reminders sent to 5 students!"
⚠️ "3 reminders failed to send"
❌ "Please select at least one student"
```

---

## 🎉 Summary

**New Features:**
- ✅ Send to selected students
- ✅ Send to all unpaid
- ✅ Professional email template
- ✅ Checkbox selection
- ✅ Real-time feedback

**All working!** 🚀

---

## 📞 Quick Help

**Emails not sending?**
→ Check SMTP settings in .env

**Students not receiving?**
→ Check spam folder

**Some failed?**
→ Check student email addresses

**Takes too long?**
→ Normal for large batches

---

**Start sending reminders now!** 📧
