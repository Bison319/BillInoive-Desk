' BillCraft Desktop - Silent Launcher
' Runs the application without showing a terminal window.
' Double-click this file or the desktop shortcut to start BillCraft.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeDir = scriptDir & "\tools\node-v20.18.0-win-x64"
electronDir = scriptDir & "\electron-app"

' Build the command
cmd = """" & nodeDir & "\npx.cmd"" electron ."""

' Run silently (0 = hidden window, False = don't wait)
WshShell.CurrentDirectory = electronDir
WshShell.Environment("Process")("PATH") = nodeDir & ";" & WshShell.Environment("Process")("PATH")
WshShell.Run cmd, 0, False
