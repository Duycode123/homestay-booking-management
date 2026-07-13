ALTER TABLE customer_issue_report
    ADD COLUMN IF NOT EXISTS admin_note VARCHAR(1000);
