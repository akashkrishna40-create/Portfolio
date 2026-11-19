# GitHub Pages deployment

The source for this site is the root `index.html`, `style.css`, `motion.js`,
`contact.js`, `projects/`, `assets/portrait.webp`, and `.nojekyll`. No build step
or package installation is required.

## Configure resume downloads

Both resume choices are configured in `index.html`, in the hero dropdown and
the contact section, using these individual Google Drive download URLs:

- HSE: `https://drive.google.com/uc?export=download&id=1Z5KHH8HVmpXtJQZ0PDw6uiVzL6W19s9w`
- Electrical: `https://drive.google.com/uc?export=download&id=1FcXw3GrJqSSK8BZsqRLSDtfrjTQtYZF0`

To change a resume later, update both occurrences of its file ID. For Google Drive, allow **Anyone with
the link** to view and download each file, then test the download while signed out.
A typical download URL is `https://drive.google.com/uc?export=download&id=FILE_ID`;
in HTML attributes, write `&` as `&amp;`. Drive may display a preview or confirmation
depending on its file policies. The external host controls the download; browsers
do not reliably honor the HTML `download` attribute for cross-origin files.

All three existing resume PDFs remain local and are ignored by Git. The ignore
rule covers PDFs with "resume" in their filenames anywhere under an `assets`
folder, regardless of capitalization. Images, icons, and fonts are not ignored.
Externally shared resumes will be accessible to visitors, including any contact
details in those PDFs; choose the versions you want to share.

## Configure the contact form

The contact form in `index.html` is configured with your public endpoint:

`https://formspree.io/f/xppdrend`

Configure/verify the destination email in the Formspree dashboard.
Only the public form endpoint belongs in the site. Keep your destination email,
account credentials, private tokens, and API keys out of the source.

The existing **Email me** button reveals the form. It checks required fields,
email format, and whitespace-only names/messages. It shows sending, success,
and failure messages, prevents duplicate submission, and times out after
20 seconds. Until configured, it displays a setup message without sending data.
Without JavaScript, the form is visible and uses ordinary HTML form submission.

The previously published `akash-krishna-portfolio.tweedylamb1.chatgpt.site` page
is a separate deployment. Local edits do not update that page automatically.
It must be redeployed separately, or use the new GitHub Pages deployment.

After configuration, send one test from the deployed site, confirm that the
message appears in Formspree and reaches your inbox, and check the reply-to email.
If you restrict allowed domains in Formspree, include your GitHub Pages domain.
Live delivery still needs to be verified with a test submission after deployment.

No phone number is displayed or configured. Add one only if you later choose
to publish it.

## Publish the root source

1. Review `git status --short --untracked-files=all` before committing.
2. Confirm `git ls-files -- '*.pdf'` shows no resumes. To check ignore rules, run
   `git check-ignore -v assets/Akash_Krishna_Resume_Electrical.pdf assets/Akash_Krishna_Resume_HSE.pdf`.
3. Commit and push the root source to your GitHub repository without forcing
   ignored files into Git.
4. In **Settings > Pages**, choose **Deploy from a branch**, select the branch
   containing the source and **/(root)**, then save. Retain `.nojekyll`.
5. Open the published URL and test all seven project links, their back links,
   the navigation anchors, both resume choices, and the configured contact form.

`_backup_default/`, `portfolio-site/`, and deployment archives remain local and
ignored. These older copies contain previous contact details and/or resumes;
do not upload them or deploy the old archive. Deploy the committed root source.
Git ignore rules apply to Git uploads, not manual drag-and-drop hosting uploads.

At inspection, the root repository had no commits or tracked files, so no
untracking or history rewrite was needed. This does not audit any separate
remote repository or previously published site.

## Local preview

Run `python -m http.server 8000 --bind 127.0.0.1` from this folder and open
`http://127.0.0.1:8000/`. Stop with Ctrl+C. This local-only server also serves
ignored files if their paths are requested; do not expose it publicly.

## References

- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Formspree JavaScript forms](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/)
- [Google Drive sharing permissions](https://support.google.com/drive/answer/7166529)
