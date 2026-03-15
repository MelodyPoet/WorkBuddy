@echo off
git -C "c:/Users/admin/WorkBuddy/20260314211855" commit -m "chore: cleanup all temp scripts"
git -C "c:/Users/admin/WorkBuddy/20260314211855" push
del "%~f0"
