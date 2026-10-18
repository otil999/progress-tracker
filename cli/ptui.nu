use eventloop *
use theme *
use desktop *
use statusbar [statusbar-paint]
use dropdown [dropdown-paint dropdown-on-key-press]

export def pt-ui [] {
    # setup
    # mut d      = (dims)
    # mut text   = ""
    # mut focus  = 0                # dialog focus: 0 = field, 1 = OK, 2 = Cancel
    # mut menu   = -1               # open menu index, or -1 when no menu is open
    # mut mitem  = 0                # selected drop-down item
    # mut dlg    = false            # is the dialog currently open?
    # mut dtitle = $title           # dialog title (set from the chosen command)
    # mut msg    = "Ready — F10 for menu"
    # mut result = { action: "cancel", name: "", item: "" }

    let style = (styles).default
    let palette = (palettes).default

    # # let screen = fill-desktop $d $style $palette
    # # render2 $screen
    # # fill-desktop $d $style $palette
    # # render $d $menu $mitem $dtitle $text $focus $msg $dlg

    # # let menus = (menu-layout)
    # # let nmenu = ($menus | length)

    # loop {
    #     let ev = (input listen --types [key resize])

    #     if $ev.type == "resize" {
    #         $d = (dims)
    #         print -n (ansi -e "2J")
    #         fill-desktop $d $style $palette
    #         render $d $menu $mitem $dtitle $text $focus $msg $dlg
    #         continue
    #     }

    #     let code  = $ev.code
    #     # `input listen` reports modifiers as strings like "keymodifiers(control)",
    #     # not bare "control" — so match on a substring, case-insensitively.
    #     let ctrl  = ($ev.modifiers | any {|m| ($m | str downcase | str contains "control") })
    #     let alt   = ($ev.modifiers | any {|m| ($m | str downcase | str contains "alt") })
    #     let shift = ($ev.modifiers | any {|m| ($m | str downcase | str contains "shift") })

    #     # ── Ctrl-C quits from anywhere ──
    #     if $ctrl and $code == "c" {
    #         $result = { action: "cancel", name: $text, item: "" }
    #         break
    #     }

    #     # ── Alt-hotkey opens a menu from anywhere ──
    #     if $alt and $ev.key_type == "char" {
    #         let hit = ($menus | where {|m| ($m.title | str downcase | str substring 0..<1) == ($code | str downcase)} | get 0?)
    #         if $hit != null {
    #             $menu = $hit.index
    #             $mitem = (next-item $hit.items (-1) 1)
    #             render $d $menu $mitem $dtitle $text $focus $msg $dlg
    #             continue
    #         }
    #     }

    #     if $menu >= 0 {
    #         # ─────────────────────── MENU MODE ───────────────────────
    #         let items = ($menus | get $menu | get items)
    #         if $code == "esc" or ($ev.key_type == "f" and $code == "f10") {
    #             $menu = -1
    #         } else if $code == "left" {
    #             $menu = (($menu - 1 + $nmenu) mod $nmenu)
    #             $mitem = (next-item ($menus | get $menu | get items) (-1) 1)
    #             fill-desktop $d $style $palette
    #         } else if $code == "right" {
    #             $menu = (($menu + 1) mod $nmenu)
    #             $mitem = (next-item ($menus | get $menu | get items) (-1) 1)
    #             fill-desktop $d $style $palette
    #         } else if $code == "up" {
    #             $mitem = (next-item $items $mitem (-1))
    #             on-menu-item-changed $d $menu $mitem
    #             continue
    #         } else if $code == "down" {
    #             $mitem = (next-item $items $mitem 1)
    #             on-menu-item-changed $d $menu $mitem
    #             continue
    #         } else if $code == "enter" {
    #             let title_m = ($menus | get $menu | get title)
    #             let chosen  = ($items | get $mitem)
    #             $menu = -1
    #             if $chosen == "Exit" {
    #                 $result = { action: "menu", name: $text, item: $"($title_m) ▸ ($chosen)" }
    #                 break
    #             } else {
    #                 # Selecting any other command opens the dialog for it.
    #                 $dtitle = $chosen
    #                 $text   = ""
    #                 $focus  = 0
    #                 $dlg    = true
    #                 $msg    = $"($title_m) ▸ ($chosen)"
    #             }
    #         }
    #     } else if $dlg {
    #         # ────────────────────── DIALOG MODE ──────────────────────
    #         if $code == "esc" {
    #             $dlg = false
    #             $msg = $"($dtitle): cancelled"
    #         } else if $ev.key_type == "f" and ($code == "f10" or $code == "10") {
    #             $menu = 0
    #             $mitem = (next-item ($menus | get 0 | get items) (-1) 1)
    #         } else if $code == "enter" {
    #             if $focus == 2 {
    #                 $dlg = false
    #                 $msg = $"($dtitle): cancelled"
    #             } else {
    #                 $result = { action: "ok", name: $text, item: $dtitle }
    #                 $dlg = false
    #                 $msg = $"($dtitle): ($text)"
    #             }
    #         } else if $code == "tab" {
    #             $focus = (if $shift { ($focus + 2) mod 3 } else { ($focus + 1) mod 3 })
    #         } else if $code == "left" {
    #             $focus = 1
    #         } else if $code == "right" {
    #             if $focus > 0 { $focus = 2 }
    #         } else if $code == "up" {
    #             $focus = 0
    #         } else if $code == "down" {
    #             if $focus == 0 { $focus = 1 }
    #         } else if $code == "backspace" {
    #             if $focus == 0 {
    #                 if ($text | str length -g) > 0 {
    #                     $text = ($text | str substring -g 0..<(($text | str length -g) - 1))
    #                 }
    #                 refresh-field $d $text
    #                 continue
    #             }
    #         } else if $ev.key_type == "char" and (not $ctrl) and (not $alt) {
    #             if $focus == 0 {
    #                 $text = $"($text)($code)"
    #                 refresh-field $d $text
    #                 continue
    #             }
    #         }
    #     } else {
    #         # ────────────────────── DESKTOP MODE ──────────────────────
    #         # No dialog is open. F10 opens the menu — but many terminals (and
    #         # Windows itself) swallow F10, so a plain hot-key letter works too.
    #         if $code == "esc" {
    #             $result = { action: "cancel", name: "", item: "" }
    #             break
    #         } else if $ev.key_type == "f" and ($code == "f10" or $code == "10") {
    #             $menu = 0
    #             $mitem = (next-item ($menus | get 0 | get items) (-1) 1)
    #         } else if $ev.key_type == "char" {
    #             let hit = ($menus | where {|m| ($m.title | str downcase | str substring 0..<1) == ($code | str downcase)} | get 0?)
    #             if $hit != null {
    #                 $menu = $hit.index
    #                 $mitem = (next-item $hit.items (-1) 1)
    #             }
    #         }
    #     }

    #     render $d $menu $mitem $dtitle $text $focus $msg $dlg
    # }

    # teardown
    # $result

    mut layout = {
        # Focus starts on the standalone edit line so it owns the keyboard (and
        # shows its cursor) as soon as the app comes up.
        focus: "editline"
        desktop: {
            statusbar: {}
            # A floating dialog window that lives in the desktop, opened by
            # File ▸ Open.... It sits before the menubar so that while it is open
            # it intercepts keys ahead of the bar (modal behaviour).
            dialog: {
                id: "dialog"
                title: "Open a File"
                x: 9 y: 2 w: 62 h: 24
                # Starts hidden. This flag is the compositor's signal that the
                # dialog is a floating widget: while it is false, paint-tree skips
                # the whole dialog subtree, so the hosted controls stay hidden
                # too until File ▸ Open... flips it true.
                open: false
                # Keyboard tab-order: Tab / Shift-Tab cycle focus through these.
                focusables: [ "dialog_name" "dialog_readonly" "dialog_mode" "dialog_files" "dialog_size" "dialog_editor" "dialog_ok" "dialog_cancel" ]
                paint: {|layout lf d| dialog-paint $layout dialog $lf $d}
                on_key_press: {|layout event| dialog-on-key-press $layout dialog $event}
                # The dialog's controls are all hosted widgets. Each declares its
                # position RELATIVE to the dialog frame (`rel` from the dialog's own
                # x/y origin), so moving the dialog moves them with it.
                dialog_name: {
                    id: "dialog_name"
                    label: "Name:"
                    rel: { x: 9 y: 2 }
                    w: 46
                    text: ""
                    paint: {|layout lf d| editline-paint $layout dialog_name $lf $d}
                    on_key_press: {|layout event| editline-on-key-press $layout dialog_name $event}
                }
                # A decorative single-line frame drawn AROUND the checkbox. It is an
                # independent widget, not part of the checkbox, and never takes
                # focus (no on_key_press, absent from `focusables`). Declared before
                # the checkbox so the checkbox paints on top of it.
                dialog_options_box: {
                    id: "dialog_options_box"
                    title: "Options"
                    rel: { x: 1 y: 3 }
                    w: 17
                    h: 3
                    paint: {|layout lf d| box-paint $layout dialog_options_box $lf $d}
                }
                # A short vertical separator dividing the Options group from the
                # mode choice box. Decorative — never takes focus.
                dialog_vsep: {
                    id: "dialog_vsep"
                    orientation: "vertical"
                    rel: { x: 22 y: 3 }
                    len: 4
                    paint: {|layout lf d| separator-paint $layout dialog_vsep $lf $d}
                }
                # A full-width horizontal separator above the buttons, capped with
                # ├ ┤ so it ties into the dialog frame. Decorative — never focuses.
                dialog_hsep: {
                    id: "dialog_hsep"
                    orientation: "horizontal"
                    rel: { x: 0 y: 20 }
                    len: 62
                    ends: true
                    paint: {|layout lf d| separator-paint $layout dialog_hsep $lf $d}
                }
                # A checkbox sitting just below the Name field. Space toggles it.
                dialog_readonly: {
                    id: "dialog_readonly"
                    label: "Read-only"
                    rel: { x: 3 y: 4 }
                    checked: false
                    paint: {|layout lf d| checkbox-paint $layout dialog_readonly $lf $d}
                    on_key_press: {|layout event| checkbox-on-key-press $layout dialog_readonly $event}
                }
                # A choice box next to the checkbox: mutually exclusive options,
                # exactly one selected. Up/Down move the selection while focused.
                dialog_mode: {
                    id: "dialog_mode"
                    rel: { x: 26 y: 4 }
                    items: [ "Text" "Binary" "Auto" ]
                    selected: 0
                    paint: {|layout lf d| choicebox-paint $layout dialog_mode $lf $d}
                    on_key_press: {|layout event| choicebox-on-key-press $layout dialog_mode $event}
                }
                # A scrollable list box of files. Up/Down/PageUp/PageDown/Home/End
                # move the selection; it scrolls to keep the selection in view.
                dialog_files: {
                    id: "dialog_files"
                    rel: { x: 3 y: 8 }
                    w: 56
                    h: 4
                    selected: 0
                    top: 0
                    items: [
                        "autoexec.bat" "config.sys" "eventloop.nu" "dialog.nu"
                        "editline.nu" "button.nu" "checkbox.nu" "choicebox.nu"
                        "listbox.nu" "primitives.nu" "theme.nu" "readme.md"
                    ]
                    paint: {|layout lf d| listbox-paint $layout dialog_files $lf $d}
                    on_key_press: {|layout event| listbox-on-key-press $layout dialog_files $event}
                }
                # A multi-line editor box. Type to insert; Enter starts a new line;
                # arrows/Home/End/PageUp/PageDown move the cursor; it scrolls both
                # ways to keep the cursor in view.
                dialog_editor: {
                    id: "dialog_editor"
                    rel: { x: 3 y: 15 }
                    w: 56
                    h: 5
                    row: 0
                    col: 0
                    top: 0
                    left: 0
                    lines: [
                        "Edit this note."
                        "Press Enter to start a new line,"
                        "arrows to move around."
                    ]
                    paint: {|layout lf d| editor-paint $layout dialog_editor $lf $d}
                    on_key_press: {|layout event| editor-on-key-press $layout dialog_editor $event}
                }
                # A dropdown choice box. Enter/Space/Down opens the list; Up/Down
                # pick; Enter accepts, Esc closes. Declared LAST of the controls so
                # its drop-down list paints on top of the editor it overlaps.
                dialog_size: {
                    id: "dialog_size"
                    label: "Size:"
                    rel: { x: 9 y: 13 }
                    w: 20
                    selected: 1
                    expanded: false
                    items: [ "Small" "Medium" "Large" "Huge" ]
                    paint: {|layout lf d| combobox-paint $layout dialog_size $lf $d}
                    on_key_press: {|layout event| combobox-on-key-press $layout dialog_size $event}
                }
                dialog_ok: {
                    id: "dialog_ok"
                    label: "  OK  "
                    rel: { x: 22 y: 21 }
                    # Accept: close the dialog, reporting the field's contents.
                    on-action: {|layout node| create-event "close-widget" $node.id { id: "dialog" name: ($layout | find-by-key dialog_name | get text) }}
                    paint: {|layout lf d| button-paint $layout dialog_ok $lf $d}
                    on_key_press: {|layout event| button-on-key-press $layout dialog_ok $event}
                }
                dialog_cancel: {
                    id: "dialog_cancel"
                    label: "Cancel"
                    rel: { x: 38 y: 21 }
                    # Dismiss the dialog without reporting anything.
                    on-action: {|layout node| create-event "close-widget" $node.id { id: "dialog" }}
                    paint: {|layout lf d| button-paint $layout dialog_cancel $lf $d}
                    on_key_press: {|layout event| button-on-key-press $layout dialog_cancel $event}
                }
            }
            menubar: {
                on_show: {|layout lf d| statusbar-paint $layout statusbar $lf $d --text "Press ~F10~ to open menu or ~Ctrl-C~ to exit"}
                hotkey: "10"
                # The bar holds only labels and which drop-down each opens, plus
                # the column its drop-down drops from. The drop-downs themselves
                # are first-class widget nodes below.
                items: [
                    { text: "File", dropdown_id: "dropdown_file" }
                    { text: "Edit", dropdown_id: "dropdown_edit" }
                    { text: "Help", dropdown_id: "dropdown_help" }
                ]
                dropdown_file: {
                    id: "dropdown_file"
                    paint: {|layout lf d| dropdown-paint $layout dropdown_file $lf $d}
                    on_key_press: {|layout event| dropdown-on-key-press $layout dropdown_file $event}
                    items: [
                        {
                            text: "New"
                            on-action: {|item| create-event "action" "dropdown" { item: $item.text }}
                            on-hover: {|layout lf d| statusbar-paint $layout statusbar $lf $d --text "Creates a new file" }
                        }
                        {
                            text: "Open..."
                            on-action: {|item| create-event "open-widget" "dropdown" { id: "dialog" focus: "dialog_name" }}
                            on-hover: {|layout lf d| statusbar-paint $layout statusbar $lf $d --text "Opens existing file" }
                        }
                        { text: "---" }
                        {
                            id: "dropdown_file_exit"
                            text: "Exit"
                            status_text: "Exit program"
                            on-action: {|item| create-event "quit" $item.id}
                        }
                    ]
                }
                dropdown_edit: {
                    id: "dropdown_edit"
                    paint: {|layout lf d| dropdown-paint $layout dropdown_edit $lf $d}
                    on_key_press: {|layout event| dropdown-on-key-press $layout dropdown_edit $event}
                    items: [
                        { text: "Copy",  on-action: {|item| create-event "action" "dropdown" { item: $item.text }} }
                        { text: "Cut",   on-action: {|item| create-event "action" "dropdown" { item: $item.text }} }
                        { text: "---" }
                        { text: "Paste", on-action: {|item| create-event "action" "dropdown" { item: $item.text }} }
                    ]
                }
                dropdown_help: {
                    id: "dropdown_help"
                    paint: {|layout lf d| dropdown-paint $layout dropdown_help $lf $d}
                    on_key_press: {|layout event| dropdown-on-key-press $layout dropdown_help $event}
                    items: [
                        { text: "About...", on-action: {|item| create-event "action" "dropdown" { item: $item.text }} }
                    ]
                }
            }
        }
    }

    event-loop $layout {style: $style palette: $palette}
}
