// Which side (client or freelancer) a request is acting as. An account with both roles sends x-demo-role;
// run() stores it for the length of the request, and actor() reads it. OWNER: Krishna.
import { AsyncLocalStorage } from 'node:async_hooks';

export const requestRole = new AsyncLocalStorage<{ role: string | null }>();
