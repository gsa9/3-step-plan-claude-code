#Requires AutoHotkey v2.0
#SingleInstance Force

; 3-Step Plan Skills hotkeys for Windows Terminal
; ClearAndCmd: escapes vim mode, clears context, then runs skill in fresh session
; ClearAndEnter: escapes vim mode, runs command in current session

ClearAndCmd(cmd) {
    Send("{Esc}")
    Sleep(200)
    Send("i")
    Sleep(200)
    SendText("/clear")
    Sleep(200)
    Send("{Enter}")
    Sleep(1500)
    SendText(cmd)
    Sleep(200)
    Send("{Enter}")
}

ClearAndEnter(cmd) {
    Send("{Esc}")
    Sleep(200)
    Send("i")
    Sleep(200)
    SendText(cmd)
    Sleep(200)
    Send("{Enter}")
}

#HotIf WinActive("ahk_exe WindowsTerminal.exe")
^h::ClearAndEnter("/gc")
^m::ClearAndEnter("/clear")
^1::SendText(" /step1 ")
^2::ClearAndCmd("/step2")
^3::ClearAndCmd("/step3")
#HotIf
