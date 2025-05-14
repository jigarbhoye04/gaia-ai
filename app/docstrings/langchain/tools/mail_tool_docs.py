LIST_GMAIL_LABELS = """
    List all Gmail labels for the authenticated user.

    This tool retrieves all Gmail labels (system and user-created) for organizing and
    filtering emails.

    When to use:
    - When planning email organization or categorization tasks
    - Before applying labels to verify label IDs exist
    - When user asks about available email categories/folders
    - Before creating new labels to avoid duplicates

    Input: No parameters required (authentication handled automatically)

    Output:
    - Dictionary with "labels" containing label objects (id, name, type)
    - Error message if operation fails

    Limitations: Requires Gmail authentication via config.
    """


LIST_GMAIL_MESSAGES = """
    List Gmail messages in the user's inbox.

    This tool fetches messages from the Gmail inbox with details like sender,
    subject, snippet, and timestamp.

    When to use:
    - When user wants to check their recent emails
    - When building an email overview or summary
    - When you need email IDs for other operations (like marking as read)
    - When user asks about their inbox contents

    Input:
    - max_results: Optional, number of messages to return (default: 20)
    - page_token: Optional, for pagination through large inboxes

    Output:
    - Dictionary with "messages" containing email details
    - nextPageToken for pagination if more results exist
    - Error message if operation fails

    Limitations: Only shows inbox messages, not all emails.
    """

SEARCH_GMAIL_MESSAGES = """
    Search Gmail messages with advanced query parameters.

    This tool allows sophisticated searching across the entire mailbox with multiple
    filtering options including sender, date, attachments, and more.

    When to use:
    - When user asks to find specific emails
    - When searching for messages from a particular sender
    - When looking for emails with attachments or date filters
    - When user mentions keywords or specific search terms
    - When the regular inbox list isn't specific enough

    Input:
    - Various filter options: query, sender, recipient, subject, etc.
    - has_attachment: Filter for messages with attachments
    - date_from/date_to: Filter by date range (YYYY/MM/DD)
    - is_read: Filter by read/unread status
    - max_results/page_token: For pagination

    Output:
    - Dictionary with "messages" matching search criteria
    - nextPageToken for pagination if more results exist
    - Error message if operation fails

    Limitations: Complex queries might be better expressed using Gmail's native query syntax.
    """

SUMMARIZE_EMAIL = """
    Summarize an email using LLM.

    This tool generates a concise summary of an email message, making it easier to
    understand long or complex emails. Can extract action items if requested.

    When to use:
    - When user wants to quickly understand an email's key points
    - When processing long, complex emails
    - When creating a digest of multiple emails
    - When extracting action items from messages
    - When user explicitly asks for email summarization

    Input:
    - message_id: Required, the Gmail message ID to summarize
    - include_action_items: Optional boolean, extracts tasks/requests
    - max_length: Optional, controls summary length in words

    Output:
    - Dictionary containing email metadata and the generated summary
    - Action items if requested
    - Error message if operation fails

    Limitations: Quality depends on email content structure; very technical or poorly
    formatted emails may yield less useful summaries.
    """

COMPOSE_EMAIL = """
    Use AI to compose an email based on a prompt.

    This tool generates complete email drafts from natural language instructions,
    adapting to different writing styles and content preferences.

    When to use:
    - When user needs help writing an email
    - When drafting responses to common email types
    - When user requests specific tone or style for an email
    - When user wants to save time on routine correspondence
    - When user provides a partial draft that needs improvement

    Input:
    - prompt: Required, description of the email to compose
    - subject/body: Optional, existing content to build upon
    - writing_style: Optional, tone preference (Professional, Casual, Formal)
    - content_length: Optional, verbosity control (Brief, Detailed)
    - clarity_option: Optional, complexity level (Simple, Technical)

    Output:
    - Dictionary with generated subject and body
    - Error message if operation fails

    Limitations: May require refinement for highly specialized or technical content;
    won't have access to user's previous communication style unless explicitly described.
    """

MARK_EMAILS_AS_READ = """
    Mark Gmail messages as read.

    This tool removes the UNREAD label from specified messages, marking them as read
    in the user's Gmail account.

    When to use:
    - When user wants to mark emails as read after viewing them
    - When implementing bulk email processing
    - After extracting information from unread emails
    - When user specifically asks to mark messages as read

    Input:
    - message_ids: Required list of Gmail message IDs to mark as read

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: Cannot be undone directly (would need to use mark_emails_as_unread).
    """

MARK_EMAILS_AS_UNREAD = """
    Mark Gmail messages as unread.

    This tool adds the UNREAD label to specified messages, marking them as unread
    in the user's Gmail account.

    When to use:
    - When user wants to flag emails for later attention
    - When emails need to be revisited later
    - When implementing "mark as unread" functionality
    - When user specifically asks to mark messages as unread

    Input:
    - message_ids: Required list of Gmail message IDs to mark as unread

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: May affect how emails appear in different Gmail views.
    """

STAR_EMAILS = """
    Star Gmail messages.

    This tool adds the STARRED label to specified messages, making them appear
    starred in Gmail. Starring highlights important emails.

    When to use:
    - When user wants to highlight important emails
    - When marking high-priority messages
    - When implementing favoriting functionality
    - When user explicitly asks to star messages

    Input:
    - message_ids: Required list of Gmail message IDs to star

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: Some Gmail views might display starred emails differently.
    """

UNSTAR_EMAILS = """
    Unstar Gmail messages.

    This tool removes the STARRED label from specified messages, removing their star
    status in Gmail.

    When to use:
    - When user wants to remove star status from emails
    - After processing previously starred emails
    - When cleaning up starred emails in bulk
    - When user explicitly asks to unstar messages

    Input:
    - message_ids: Required list of Gmail message IDs to unstar

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: Only affects starred messages, no effect on unstarred ones.
    """

ARCHIVE_EMAILS = """
    Archive Gmail messages.

    This tool removes the INBOX label from specified messages, archiving them in Gmail.
    Archiving keeps emails accessible but removes them from the inbox view.

    When to use:
    - When user wants to clean up their inbox
    - After emails have been processed and no longer need attention
    - When implementing "archive" or "clean up" functionality
    - When user explicitly asks to archive messages

    Input:
    - message_ids: Required list of Gmail message IDs to archive

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: Archived emails remain searchable and retain other labels.
    """

MOVE_EMAILS_TO_INBOX = """
    Move Gmail messages to inbox.

    This tool adds the INBOX label to specified messages, moving them to the user's
    inbox. This effectively unarchives emails or ensures they appear in the inbox view.

    When to use:
    - When user wants to restore previously archived emails
    - When emails need renewed attention in the inbox
    - When implementing "move to inbox" functionality
    - When user explicitly asks to move messages to inbox

    Input:
    - message_ids: Required list of Gmail message IDs to move to inbox

    Output:
    - Dictionary with success status and affected message IDs
    - Error message if operation fails

    Limitations: Messages already in inbox will remain unchanged.
    """

GET_EMAIL_THREAD = """
    Get complete email thread.

    This tool fetches all messages in a specified Gmail thread, showing the complete
    conversation history in chronological order.

    When to use:
    - When user wants to see an entire email conversation
    - When analyzing email threads or discussions
    - When preparing responses that require conversation context
    - When user asks about previous messages in a thread
    - When summarizing multi-message conversations

    Input:
    - thread_id: Required, the Gmail thread ID to fetch

    Output:
    - Dictionary with thread_id and messages array containing all emails
    - Error message if operation fails

    Limitations: Long threads may contain large amounts of data; specific messages
    still need to be processed individually for detailed operations.
    """

CREATE_GMAIL_LABEL = """
    Create a new Gmail label.

    This tool creates a new label in the user's Gmail account for email organization.
    Labels in Gmail function like folders but allow emails to have multiple labels.

    When to use:
    - When user wants to create new email categories
    - When setting up email organization systems
    - Before applying non-existent labels to emails
    - When user explicitly asks to create a label

    Input:
    - name: Required, name for the new label
    - label_list_visibility: Optional, controls visibility in label list
    - message_list_visibility: Optional, controls visibility next to messages
    - background_color/text_color: Optional, visual customization (hex codes)

    Output:
    - Dictionary with success status and created label object
    - Error message if operation fails

    Limitations: Cannot create system labels; duplicate names will be rejected.
    """

UPDATE_GMAIL_LABEL = """
    Update an existing Gmail label.

    This tool modifies properties of an existing label in the user's Gmail account,
    such as its name, visibility, or colors.

    When to use:
    - When user wants to rename or modify label properties
    - When changing label visibility settings
    - When adjusting label colors for visual organization
    - When user explicitly asks to update a label

    Input:
    - label_id: Required, ID of the label to update
    - name: Optional, new name for the label
    - label_list_visibility/message_list_visibility: Optional visibility settings
    - background_color/text_color: Optional, visual customization (hex codes)

    Output:
    - Dictionary with success status and updated label object
    - Error message if operation fails

    Limitations: System labels like INBOX, SENT, etc. cannot be modified.
    """

DELETE_GMAIL_LABEL = """
    Delete a Gmail label.

    This tool removes an existing label from the user's Gmail account. Emails with
    this label will lose it, but the emails themselves will not be deleted.

    When to use:
    - When user wants to remove unused or obsolete labels
    - When reorganizing email categorization systems
    - When cleaning up label clutter
    - When user explicitly asks to delete a label

    Input:
    - label_id: Required, ID of the label to delete

    Output:
    - Dictionary with success status and deleted label ID
    - Error message if operation fails

    Limitations: System labels like INBOX, SENT, etc. cannot be deleted;
    deletion is permanent and cannot be undone.
    """

APPLY_LABELS_TO_EMAILS = """
    Apply labels to Gmail messages.

    This tool adds specified labels to given messages, enabling organization
    and categorization of emails. Multiple labels can be applied to the same emails.

    When to use:
    - When user wants to categorize or organize emails
    - When implementing auto-filing or tagging systems
    - When user needs to batch-process email organization
    - When user explicitly asks to label messages

    Input:
    - message_ids: Required list of Gmail message IDs to label
    - label_ids: Required list of label IDs to apply

    Output:
    - Dictionary with success status and details of labeled messages
    - Error message if operation fails

    Limitations: Requires valid label IDs obtained from list_gmail_labels or create_gmail_label.
    """

REMOVE_LABELS_FROM_EMAILS = """
    Remove labels from Gmail messages.

    This tool removes specified labels from given messages. This is useful for
    declassifying emails or changing their categorization.

    When to use:
    - When user wants to reorganize email categories
    - When emails no longer belong to certain groups
    - When implementing label management features
    - When user explicitly asks to remove labels from messages

    Input:
    - message_ids: Required list of Gmail message IDs to modify
    - label_ids: Required list of label IDs to remove

    Output:
    - Dictionary with success status and details of modified messages
    - Error message if operation fails

    Limitations: Removing the INBOX label has the effect of archiving emails;
    system labels have special behavior.
    """

CREATE_EMAIL_DRAFT = """
    Create a draft email.

    This tool creates a draft email in the user's Gmail account without sending it.
    Drafts can be reviewed, edited, and sent later.

    When to use:
    - When user wants to compose an email but not send it immediately
    - When preparing emails that need review before sending
    - When creating templates for future use
    - When AI-generated content needs human approval
    - When user explicitly asks to draft an email

    Input:
    - to: Required list of recipient email addresses
    - subject: Required email subject line
    - body: Required email content
    - cc/bcc: Optional additional recipients
    - is_html: Optional boolean, whether body contains HTML formatting

    Output:
    - Dictionary with success status and draft object with ID
    - Error message if operation fails

    Limitations: Draft remains in the user's account until explicitly sent or deleted.
    """

LIST_EMAIL_DRAFTS = """
    List all draft emails.

    This tool fetches all draft emails stored in the user's Gmail account.
    Pagination support is available for accounts with many drafts.

    When to use:
    - When user wants to see their saved drafts
    - When managing draft emails
    - Before updating or sending drafts (to get their IDs)
    - When user asks about incomplete or unsent emails
    - When implementing draft management functionality

    Input:
    - max_results: Optional, number of drafts to return (default: 20)
    - page_token: Optional, for pagination through many drafts

    Output:
    - Dictionary with "drafts" containing draft objects
    - nextPageToken for pagination if more results exist
    - Error message if operation fails

    Limitations: Draft content is summarized; use get_email_draft for complete details.
    """

GET_EMAIL_DRAFT = """
    Get a specific draft email.

    This tool fetches the full content and details of a specific draft email from the
    user's Gmail account, allowing for review before editing or sending.

    When to use:
    - When user wants to review a specific draft
    - Before updating or sending a draft
    - When implementing draft editing features
    - When user asks to see the content of a saved draft
    - After list_email_drafts to get complete details

    Input:
    - draft_id: Required, ID of the draft to fetch

    Output:
    - Dictionary with "draft" containing full message details
    - Error message if operation fails

    Limitations: Requires a valid draft ID from list_email_drafts.
    """


UPDATE_EMAIL_DRAFT = """
    Update a draft email.

    This tool modifies an existing draft email in the user's Gmail account,
    allowing for changes to recipients, subject, body, or other properties.

    When to use:
    - When user wants to edit a previously saved draft
    - When correcting or improving email content
    - When adding or changing recipients
    - After AI-generated content needs human adjustments
    - When user explicitly asks to update a draft

    Input:
    - draft_id: Required, ID of the draft to update
    - to: Required list of recipient email addresses
    - subject: Required email subject line
    - body: Required email content
    - cc/bcc: Optional additional recipients
    - is_html: Optional boolean, whether body contains HTML formatting

    Output:
    - Dictionary with success status and updated draft object
    - Error message if operation fails

    Limitations: All recipient/subject/body fields must be provided with each update,
    even those that aren't changing.
    """

DELETE_EMAIL_DRAFT = """
    Delete a draft email.

    This tool deletes an existing draft email from the user's Gmail account,
    permanently removing it from the Drafts folder.

    When to use:
    - When user wants to remove a draft that's no longer needed
    - When cleaning up outdated draft emails
    - When user has created an improved version of a draft
    - When user explicitly asks to delete a draft

    Input:
    - draft_id: Required, ID of the draft to delete

    Output:
    - Dictionary with success status
    - Error message if operation fails

    Limitations: Deletion is permanent and cannot be undone; requires a valid
    draft ID from list_email_drafts.
    """

SEND_EMAIL_DRAFT = """
    Send a draft email.

    This tool sends an existing draft email from the user's Gmail account,
    delivering it to all recipients specified in the draft.

    When to use:
    - When user wants to send a finalized draft
    - After reviewing and confirming draft content
    - To deliver emails that were prepared in advance
    - When user explicitly asks to send a draft

    Input:
    - draft_id: Required, ID of the draft to send

    Output:
    - Dictionary with success status and sent message details
    - Error message if operation fails

    Limitations: Once sent, emails cannot be unsent; draft is automatically
    moved to Sent folder after sending.
    """
