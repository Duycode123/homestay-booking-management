INSERT INTO staff (account_id, full_name, email)
SELECT account.id,
       COALESCE(NULLIF(split_part(account.email, '@', 1), ''), account.email),
       account.email
FROM account
LEFT JOIN staff ON staff.account_id = account.id
WHERE account.role = 'STAFF'
  AND staff.id IS NULL;
