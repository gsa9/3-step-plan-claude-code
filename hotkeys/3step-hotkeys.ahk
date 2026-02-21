#Requires AutoHotkey v2.0
#SingleInstance Force

; 3-Step Plan Skills hotkeys for Windows Terminal

EscToInsert() {
    KeyWait("Ctrl")
    Send("{Esc}")
    Sleep(200)
    Send("i")
    Sleep(200)
}

ClearAndCmd(cmd) {
    EscToInsert()
    SendText("/clear")
    Sleep(200)
    Send("{Enter}")
    Sleep(2500)
    SendText(cmd)
    Sleep(200)
    Send("{Enter}")
}

EscAndEnter(cmd) {
    EscToInsert()
    SendText(cmd)
    Sleep(200)
    Send("{Enter}")
}

#HotIf WinActive("ahk_exe WindowsTerminal.exe")
^h::EscAndEnter(" /gc")
^m::EscAndEnter("/clear")
^1::EscAndEnter(" /step1")
^2::ClearAndCmd("/step2")
^3::ClearAndCmd("/step3")
#HotIf
