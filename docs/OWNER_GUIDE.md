# Running your Kunta Nia shop: a guide for the owner

This guide is for you, not for a developer. You don't need to know anything technical. Everything
you do day to day happens in the **admin area**, which works well on your phone.

> **Your developer sets this up for you:** your admin email and password, the Yoco and email
> connections. After that, this guide is all you need.

---

## 1. Signing in

1. Go to your website address and add **/admin** at the end, for example
   `www.yourshop.co.za/admin`.
2. Enter your email and password and tap **Sign in**.
3. For your safety you are signed out automatically after **8 hours**. Tap **Sign out** (top right)
   when you finish, especially on a shared phone or computer.

**Forgot your password?** Ask your developer to reset it. It takes them a minute.

**Keep it safe:** use a long password that you don't use anywhere else, and never share it. If
someone else needs access, ask your developer to give them their own login.

---

## 2. Your daily routine

Each day, open the **Dashboard** (the first page after you sign in). It shows:

- **Today / This week / This month:** how many paid orders and how much money came in. Only
  orders that have been **paid** are counted.
- **Orders to ship:** the paid orders waiting for you to pack and send. **This is your to-do list.**
  Tap an order number to open it.
- **Low stock:** products running out. Order more before they hit zero.
- **Messages:** customer messages you haven't dealt with yet.

If an order shows a red **"Stock problem"**, see section 5.

---

## 3. Processing an order (from "paid" to "delivered")

When a customer pays, two things happen automatically:

- they get a **confirmation email**, and
- **you get an email** telling you there's a new order.

The order then appears under **Orders to ship**. Here's what to do:

### Step 1: Pack it

Open the order and tap **Packing slip**. It opens a clean page with the items and the address.
Tap **Print** and put the slip in the parcel.

_(Optional)_ Tap **Mark as processing** to show yourself you've started on it. The customer is not
emailed for this.

### Step 2: Book the courier

Book the courier yourself, the way you do now. Write down the **courier name** and the
**tracking number**.

### Step 3: Mark it as shipped

On the order page, find the box **Mark as shipped** and fill in:

- **Courier** (required), for example "The Courier Guy"
- **Tracking number**
- **Tracking link** (optional, if the courier gives you one)

Then tap **Mark as shipped and email customer**. The customer is emailed straight away with their
tracking details. You'll see a green message confirming it.

### Step 4: Mark it as delivered

When the parcel arrives, open the order and tap **Mark as delivered**. (No email is sent.)

### What the statuses mean

| Status               | Meaning                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Awaiting payment** | The customer started checkout but hasn't paid. **Do not send anything.** Unpaid orders are cancelled automatically after 48 hours. |
| **Payment received** | Paid. Time to pack it.                                                                                                             |
| **Being prepared**   | You've marked it as processing.                                                                                                    |
| **Shipped**          | On its way to the customer.                                                                                                        |
| **Delivered**        | Arrived.                                                                                                                           |
| **Cancelled**        | Cancelled. Nothing more to do.                                                                                                     |
| **Refunded**         | Money was returned to the customer.                                                                                                |

**Important:** the shop decides an order is paid automatically, when Yoco confirms the payment.
You can never mark an order as paid by hand, and you shouldn't need to. If a customer says they
paid but the order says **Awaiting payment**, see section 9.

### Finding an order

Tap **Orders**. Use the search box (order number like `KN-10042`, the customer's email, or their
name) and the **Status** filter, then tap **Filter**.

### Order notes

Each order has a **Notes** box that only you can see. Type anything useful and tap **Save notes**.

---

## 4. Cancelling and refunding

### Cancel an order

Open the order and tap **Cancel order**. You'll be asked to confirm. This can't be undone.

- If the order was **not yet paid**: it's simply cancelled.
- If the customer **had paid** and you hadn't shipped: the items go **back into your stock
  automatically**, the customer is emailed, and the order's history reminds you that you must
  **refund them in Yoco** (see below).

### Refund an order

1. **First make the refund in your Yoco account.** Log in to Yoco, find the payment and
   refund it.
2. **Then** open the order in your shop admin and tap **Mark as refunded**. The customer is
   emailed.

> **Why two steps?** The shop admin can only _record_ a refund. The money is returned by Yoco.
> If you only tap the button here, the customer does **not** get their money.

---

## 5. When an order says "Stock problem"

Very rarely, two people buy the last item at nearly the same time. The second person has paid, but
there is no stock left. The order is still marked **paid** (so it isn't lost), and you'll get an
email starting **[STOCK PROBLEM]** and a red warning on the order.

What to do: if you can restock quickly, ship it as normal. If you can't, contact the customer
by email, explain, and offer a refund or a wait. Then handle it as in section 4.

---

## 6. Stock and prices

Tap **Products**, then tap a product's name.

- **Stock:** change the number and tap **Save changes**. Update this when you make or receive new
  stock. When the number reaches 0, customers see "Sold out" and can't buy it.
- **Price:** type the price in rands including VAT, for example `149.90`, and tap **Save changes**.
- **Old price (sale):** type a _higher_ old price in "Old price to cross out" to show a sale. Leave
  it empty when there's no sale.
- **Show this product in the shop:** untick this and save to hide a product without deleting it.
- **Descriptions, benefits, how to use, ingredients, warnings:** edit the text and save. Changes
  appear on the website straight away.
- **Photos:** your developer adds the photo _files_; you choose which ones to show, in what order,
  and write a short description of each (this helps people using screen readers and Google).

If you see a note saying a product still has "TODO(CLIENT)" text, that's placeholder text
that must be replaced before customers see it.

> **Be careful with health claims.** Words like "grows hair", "repairs", "treats" can break South
> African advertising rules for cosmetics. Keep to what you can prove, and check with your
> developer or a legal adviser before changing the wording.

---

## 7. Discount codes

Tap **Discount codes**.

**To create one:** scroll to **Create a new code** and fill in:

- **Code:** what customers type, for example `WELCOME10`. Capital letters are used automatically.
- **Type:** _Percentage off_ (for example 10 for 10%) or _Rand amount off_ (for example 50).
- **Minimum spend** (optional): they must spend at least this much.
- **Maximum uses** (optional): for example 50 so only the first 50 customers can use it.
- **Starts on / Last day** (optional): the code only works between these dates (the last day
  counts, to the end of that day).

Tap **Create code**.

**To switch a code off:** tap **Deactivate** next to it in the list (and **Activate** to switch it
back on). To change other details, tap the code, change them and save. A code can't be renamed.

A code counts as "used" once an order that used it has been **paid**.

---

## 8. Messages, subscribers and your bookkeeper

- **Messages:** customer messages from the Contact page. Tap **Reply by email** to answer from
  your email app, then **Mark as handled**. New messages are listed first.
- **Subscribers:** people who ticked the box to get your newsletter. Tap **Download active
  subscribers (CSV)** to get a spreadsheet you can upload to your email tool. It only includes
  people who are still subscribed.
  _Remember:_ every marketing email must include an **unsubscribe link**, and you must never
  email people who unsubscribed.
- **Orders for your bookkeeper:** on the **Orders** page, tap **Export orders to CSV (for the
  bookkeeper)**, choose the dates, and tap **Download CSV**. It opens in Excel or Google Sheets
  and includes totals, VAT, discounts, shipping and the Yoco reference.

---

## 9. When something looks wrong

**"A customer says they paid but the order says Awaiting payment."**
Wait a few minutes first; confirmation usually takes less than a minute. If it's still
_Awaiting payment_, check your **Yoco account**: if Yoco shows the payment as complete,
contact your developer and give them the order number: the connection that tells the shop about
payments may be broken. **Don't ship until Yoco shows the money.**

**"An order's history says 'Payment notification rejected'."**
Something about that payment didn't match what was expected (for example the amount). **Check it
in Yoco before you ship anything**, and tell your developer.

**"Customers aren't getting emails" or "the history says 'Email FAILED'".**
The email connection may be broken. The order itself is fine. On the order page tap **Resend
order confirmation email** once it's fixed, and tell your developer.

**"I can't sign in."** Ask your developer to reset your password.

**"The website seems down."** Tell your developer. There is a health check at
`yourshop.co.za/api/health` that should say `"status":"ok"`.

---

## 10. What your customers receive

| When                          | Email                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------- |
| They pay                      | **Order confirmation** with items, totals, delivery address and what happens next |
| You tap _Mark as shipped_     | **Shipped** with the courier and tracking details                                 |
| You cancel a paid order       | **Cancelled** with a note about their refund                                      |
| You tap _Mark as refunded_    | **Refunded**                                                                      |
| They fill in the contact form | A "we've received your message" note (and you get their message)                  |
| They join the newsletter      | A welcome email with an unsubscribe link                                          |

Customers can also look up their order any time on your site under **Check your order** (they need
their order number and email).

---

## 11. Quick reference

| I want to...                | Go to...                                                   |
| --------------------------- | ---------------------------------------------------------- |
| See what to ship            | Dashboard, **Orders to ship**                              |
| Print a packing slip        | Orders, open the order, **Packing slip**                   |
| Send the tracking details   | Open the order, **Mark as shipped**                        |
| Change stock or price       | Products, tap the product                                  |
| Hide a product              | Products, tap it, untick **Show this product in the shop** |
| Make a discount code        | Discount codes, **Create a new code**                      |
| Answer a customer           | Messages, **Reply by email**                               |
| Get a spreadsheet of orders | Orders, **Export orders to CSV**                           |
| Refund a customer           | Do it in **Yoco** first, then **Mark as refunded** here    |
