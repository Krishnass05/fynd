# Demo script (about 6 minutes)

For showing the product to the MBA team. All data is synthetic. Rates and hours are illustrative, not market data.

## Set up (once, before the audience arrives)

```bash
git checkout krishna
git pull origin krishna
npm install
npm run dev
```

Open http://localhost:3000. The data is in memory, so restart `npm run dev` to get a clean start before each run. Use two browser windows side by side: one as the **client**, one as the **freelancer**. In the second window use a private window, because the demo user is remembered per browser.

Sample files are in `docs/demo/`: `signed-sow.txt` and `amended-sow.txt`.

## The story

A small cafe hires a freelancer to design a logo. Halfway through, the cafe asks for more. Today that becomes an argument. Here it becomes a priced, approved, recorded change order.

| Step | Who | What to click | What to say |
| --- | --- | --- | --- |
| 1. The job | Client | Continue as Demo Client, then My jobs, then "Logo for a new cafe" | The client posted a job. Two freelancers applied with different prices. Open the comparison table to see them side by side |
| 2. Hire | Client | Accept **Second Freelancer** | Accepting closes the job and opens a shared project workspace for both sides |
| 3. Agree the scope | Freelancer | Continue as Second Freelancer, open the project, upload `signed-sow.txt` | The signed SOW is the baseline. What is included and what is excluded is now on record |
| 4. Client asks for more | Client | Open the project, upload `amended-sow.txt` | The site compares the two documents. Nobody argued about it |
| 5. Read the result | Client | Look at the change orders | **Brand guidelines** was excluded in the signed SOW, so it is flagged and priced at 6 hours x Rs 1000 = **Rs 6,000 before tax**. **Social media banners** is also excluded: 4 hours, Rs 4,000. **Menu design** has no hours, so it is not priced until clarified. We never guess zero |
| 6. Decide | Client | Approve brand guidelines, reject social banners with a reason | The client decides with the price in front of them |
| 7. Freelancer view | Freelancer | Open the dashboard | Approved value, capacity used, what is waiting. The rejected change is not counted as work |
| 8. No double charge | Client | Upload `amended-sow.txt` again | Nothing changes. The same document cannot be charged twice |
| 9. The scored checks | Anyone | Open `/demo` | The three case checks run in order and pass |

## Things to say about limits (be upfront)

- Data is synthetic. Rates, hours and prices are illustrative.
- The comparison reads .txt and .md files today. PDF reading is next.
- It is a workflow aid. It is not legal advice, and approvals here are not a signed contract.
- Sign-in is a demo role switch for now.
- Tax is shown separately and not added to the change amount.

## Questions to put to the MBA team

Answers to these feed the business proof. Record who said what, and keep **observed** separate from **assumed**.

1. Who would pay: the freelancer, the client, or both? Per seat, per project, or a small fee per approved change?
2. What price feels fair for a small agency owner? What would they compare it to?
3. In the last three jobs you know of, how much extra work went unpaid?
4. Which step above would make you trust the number, and which would you doubt?
5. What would make a client refuse to use this?
