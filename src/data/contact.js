/**
 * FormSubmit delivers enquiries to this address — no account needed. The
 * first submission triggers a one-time activation email to
 * mally@beardbros.in; activate it there or every submission before that
 * point will fail silently. After activating you can swap in the
 * random-alias endpoint FormSubmit gives you to keep the address out of
 * the bundle. Shared by the /contact page form and the phone's Mail app so
 * both land in the same inbox.
 */
export const FORM_ENDPOINT = 'https://formsubmit.co/ajax/mally@beardbros.in';
