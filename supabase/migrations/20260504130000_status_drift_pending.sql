-- Status-Drift: 'zur_pruefung' wird konsolidiert auf 'pending'.
-- Der Banner und die Server-Actions arbeiten nur noch mit 'pending';
-- Alt-Datensätze müssen migriert werden.
update inserate set status = 'pending' where status = 'zur_pruefung';
