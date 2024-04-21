---
title: "Dotfiles"
date: 2023-02-17T00:50:19+08:00
math: true
slug: "Dotfiles"
# weight: 1
# aliases: ["", ""]
# tags: ["Tag1", "Tag2"]
# categories: [""]
# author: ["", ""]
# showToc: true
# TocOpen: false
# draft: false
# hidemeta: false
# comments: false
# description: "Desc Text."
---

## oh-my-zsh

```bash
# ~/.zshrc

plugins=(
    git
    colored-man-pages
    command-not-found
    fzf-zsh-plugin
    zsh-wakatime
    zsh-autosuggestions
    zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

export http_proxy="127.0.0.1:7890"
export https_proxy="127.0.0.1:7890"
alias unproxy="unset http_proxy https_proxy"

alias l="exa -FHlahb --git"
alias ll="exa -FHlahb --git"

alias chrome='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome'

alias ip="dig +short myip.opendns.com @resolver1.opendns.com"
alias localip="ipconfig getifaddr en0"
alias ips="ifconfig -a | grep -o 'inet6\? \(addr:\)\?\s\?\(\(\([0-9]\+\.\)\{3\}[0-9]\+\)\|[a-fA-F0-9:]\+\)' | awk '{ sub(/inet6? (addr:)? ?/, \"\"); print }'"

# Canonical hex dump; some systems have this symlinked
command -v hd > /dev/null || alias hd="hexdump -C"

# macOS has no `md5sum`, so use `md5` as a fallback
command -v md5sum > /dev/null || alias md5sum="md5"

# macOS has no `sha1sum`, so use `shasum` as a fallback
command -v sha1sum > /dev/null || alias sha1sum="shasum"

# Recursively delete `.DS_Store` files
alias cleanup="find . -type f -name '*.DS_Store' -ls -delete"

# Print each PATH entry on a separate line
alias path='echo -e ${PATH//:/\\n}'

# Extract archives -- usage: extract <file>
function extract () {
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2) tar xjf $1 ;;
      *.tar.gz) tar xzf $1 ;;
      *.bz2) bunzip2 $1 ;;
      *.rar) unrar e $1 ;;
      *.gz) gunzip $1 ;;
      *.tar) tar xf $1 ;;
      *.tbz2) tar xjf $1 ;;
      *.tgz) tar xzf $1 ;;
      *.zip) unzip "$1" ;;
      *.Z) uncompress $1 ;;
      *.7z) 7z x $1 ;;
      *) echo "'$1' cannot be extracted via extract()" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

export HOMEBREW_NO_AUTO_UPDATE=1

export ZSH_WAKATIME_PROJECT_DETECTION=true

# Make vim the default editor.
export EDITOR='vim';
alias vi="nvim"
alias vim="nvim"

# Enable persistent REPL history for `node`.
export NODE_REPL_HISTORY=~/.node_history;
# Allow 32³ entries; the default is 1000.
export NODE_REPL_HISTORY_SIZE='32768';
# Use sloppy mode by default, matching web browsers.
export NODE_REPL_MODE='sloppy';

# Make Python use UTF-8 encoding for output to stdin, stdout, and stderr.
export PYTHONIOENCODING='UTF-8';

# Highlight section titles in manual pages.
export LESS_TERMCAP_md="${yellow}";

# Don’t clear the screen after quitting a manual page.
export MANPAGER='less -X';

# Avoid issues with `gpg` as installed via Homebrew.
# https://stackoverflow.com/a/42265848/96656
export GPG_TTY=$(tty);

# Hide the “default interactive shell is now zsh” warning on macOS.
export BASH_SILENCE_DEPRECATION_WARNING=1;

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

eval "$(zoxide init --cmd cd zsh)"

eval "$(starship init zsh)"
```

## Alacritty

```yaml
# ~/.config/alacritty/alacritty.yml

env:
  # TERM variable
  #
  # This value is used to set the `$TERM` environment variable for
  # each instance of Alacritty. If it is not present, alacritty will
  # check the local terminfo database and use `alacritty` if it is
  # available, otherwise `xterm-256color` is used.
  TERM: xterm-256color

window:
  # Window dimensions (changes require restart)
  #
  # Number of lines/columns (not pixels) in the terminal. Both lines and columns
  # must be non-zero for this to take effect. The number of columns must be at
  # least `2`, while using a value of `0` for columns and lines will fall back
  # to the window manager's recommended size
  dimensions:
    columns: 120
    lines: 34

  # Window position (changes require restart)
  #
  # Specified in number of pixels.
  # If the position is not set, the window manager will handle the placement.
  #position:
  #  x: 0
  #  y: 0

  # Window padding (changes require restart)
  #
  # Blank space added around the window in pixels. This padding is scaled
  # by DPI and the specified value is always added at both opposing sides.
  # padding:
    # x: 18
    # y: 14
  # Spread additional padding evenly around the terminal content.
  dynamic_padding: true

  # Window decorations
  #
  # Values for `decorations`:
  #     - full: Borders and title bar
  #     - none: Neither borders nor title bar
  #
  # Values for `decorations` (macOS only):
  #     - transparent: Title bar, transparent background and title bar buttons
  #     - buttonless: Title bar, transparent background and no title bar buttons
  decorations: full

  # Background opacity
  #
  # Window opacity as a floating point number from `0.0` to `1.0`.
  # The value `0.0` is completely transparent and `1.0` is opaque.
  #opacity: 1.0
  opacity: 0.97

  # Startup Mode (changes require restart)
  #
  # Values for `startup_mode`:
  #   - Windowed
  #   - Maximized
  #   - Fullscreen
  #
  # Values for `startup_mode` (macOS only):
  #   - SimpleFullscreen
  #startup_mode: Windowed

  # Window title
  title: Alacritty

  # Allow terminal applications to change Alacritty's window title.
  dynamic_title: true

  # Window class (Linux/BSD only):
  #class:
    # Application instance name
    #instance: Alacritty
    # General application class
    #general: Alacritty

  # Decorations theme variant
  #
  # Override the variant of the System theme/GTK theme/Wayland client side
  # decorations. Commonly supported values are `Dark`, `Light`, and `None` for
  # auto pick-up. Set this to `None` to use the default theme variant.
  decorations_theme_variant: Dark

  # Make `Option` key behave as `Alt` (macOS only):
  #   - OnlyLeft
  #   - OnlyRight
  #   - Both
  #   - None (default)
  #option_as_alt: None

scrolling:
  # How many lines of scrollback to keep,
  # '0' will disable scrolling.
  history: 10000

  # Number of lines the viewport will move for every line
  # scrolled when scrollback is enabled (history > 0).
  multiplier: 3

  # Faux Scrolling
  #
  # The `faux_multiplier` setting controls the number
  # of lines the terminal should scroll when the alternate
  # screen buffer is active. This is used to allow mouse
  # scrolling for applications like `man`.
  #
  # To disable this completely, set `faux_multiplier` to 0.
  faux_multiplier: 3

  # Automatically scroll to the bottom when new text is written
  # to the terminal.
  auto_scroll: false

# Font configuration
font:
  # Normal (roman) font face
  normal:
    # Font family
    #
    # Default:
    #   - (macOS) Menlo
    #   - (Linux/BSD) monospace
    #   - (Windows) Consolas
    family: "JetBrainsMono Nerd Font Mono"

    # The `style` can be specified to pick a specific face.
    style: Regular

  # Bold font face
  #bold:
    # Font family
    #
    # If the bold family is not specified, it will fall back to the
    # value specified for the normal font.
    #family: monospace

    # The `style` can be specified to pick a specific face.
    #style: Bold

  # Italic font face
  #italic:
    # Font family
    #
    # If the italic family is not specified, it will fall back to the
    # value specified for the normal font.
    #family: monospace

    # The `style` can be specified to pick a specific face.
    #style: Italic

  # Bold italic font face
  #bold_italic:
    # Font family
    #
    # If the bold italic family is not specified, it will fall back to the
    # value specified for the normal font.
    #family: monospace

    # The `style` can be specified to pick a specific face.
    #style: Bold Italic

  # Point size
  size: 16.0

  # Offset is the extra space around each character. `offset.y` can be thought
  # of as modifying the line spacing, and `offset.x` as modifying the letter
  # spacing.
  #offset:
  #  x: 0
  #  y: 0

  # Glyph offset determines the locations of the glyphs within their cells with
  # the default being at the bottom. Increasing `x` moves the glyph to the
  # right, increasing `y` moves the glyph upward.
  #glyph_offset:
  #  x: 0
  #  y: 0

  # Use built-in font for box drawing characters.
  #
  # If `true`, Alacritty will use a custom built-in font for box drawing
  # characters (Unicode points 2500 - 259f).
  #
  #builtin_box_drawing: true

# If `true`, bold text is drawn using the bright color variants.
draw_bold_text_with_bright_colors: true

# Colors (iTerm2)
colors:
  # Default colors
  primary:
    background: '0x000000'
    foreground: '0xc7c7c7'
  cursor:
    text: '0xc7c7c7'
    cursor: '0xfffefe'

  # Normal colors
  normal:
    black:   '0x000000'
    red:     '0xcf2004'
    green:   '0x00c200'
    yellow:  '0xc7c400'
    blue:    '0x0225c7'
    magenta: '0xc930c7'
    cyan:    '0x00c5c7'
    white:   '0xc7c7c7'

  # Bright colors
  bright:
    black:   '0x676767'
    red:     '0xe4544e'
    green:   '0x78e364'
    yellow:  '0xe5e152'
    blue:    '0x6871ff'
    magenta: '0xff76ff'
    cyan:    '0x5ffdff'
    white:   '0xd0d0d0'

# Bell
#
# The bell is rung every time the BEL control character is received.
#bell:
  # Visual Bell Animation
  #
  # Animation effect for flashing the screen when the visual bell is rung.
  #
  # Values for `animation`:
  #   - Ease
  #   - EaseOut
  #   - EaseOutSine
  #   - EaseOutQuad
  #   - EaseOutCubic
  #   - EaseOutQuart
  #   - EaseOutQuint
  #   - EaseOutExpo
  #   - EaseOutCirc
  #   - Linear
  #animation: EaseOutExpo

  # Duration of the visual bell flash in milliseconds. A `duration` of `0` will
  # disable the visual bell animation.
  #duration: 0

  # Visual bell animation color.
  #color: '#ffffff'

  # Bell Command
  #
  # This program is executed whenever the bell is rung.
  #
  # When set to `command: None`, no command will be executed.
  #
  # Example:
  #   command:
  #     program: notify-send
  #     args: ["Hello, World!"]
  #
  #command: None

selection:
  # This string contains all characters that are used as separators for
  # "semantic words" in Alacritty.
  semantic_escape_chars: ",│`|:\"' ()[]{}<>\t"

  # When set to `true`, selected text will be copied to the primary clipboard.
  save_to_clipboard: false

cursor:
  # Cursor style
  style:
    # Cursor shape
    #
    # Values for `shape`:
    #   - ▇ Block
    #   - _ Underline
    #   - | Beam
    shape: Beam

    # Cursor blinking state
    #
    # Values for `blinking`:
    #   - Never: Prevent the cursor from ever blinking
    #   - Off: Disable blinking by default
    #   - On: Enable blinking by default
    #   - Always: Force the cursor to always blink
    blinking: On

  # Vi mode cursor style
  #
  # If the vi mode cursor style is `None` or not specified, it will fall back to
  # the style of the active value of the normal cursor.
  #
  # See `cursor.style` for available options.
  vi_mode_style: 
    shape: Beam

  # Cursor blinking interval in milliseconds.
  #blink_interval: 750

  # Time after which cursor stops blinking, in seconds.
  #
  # Specifying '0' will disable timeout for blinking.
  #blink_timeout: 5

  # If this is `true`, the cursor will be rendered as a hollow box when the
  # window is not focused.
  #unfocused_hollow: true

  # Thickness of the cursor relative to the cell width as floating point number
  # from `0.0` to `1.0`.
  #thickness: 0.15

# Live config reload (changes require restart)
live_config_reload: true

# Shell
#
# You can set `shell.program` to the path of your favorite shell, e.g.
# `/bin/fish`. Entries in `shell.args` are passed unmodified as arguments to the
# shell.
#
# Default:
#   - (Linux/BSD/macOS) `$SHELL` or the user's login shell, if `$SHELL` is unset
#   - (Windows) powershell
shell:
  program: /opt/homebrew/bin/tmux # <- set this to the path of your tmux installation
  args:
    - new-session
    - -A
    - -D
    - -s
    - main
# Startup directory
#
# Directory the shell is started in. If this is unset, or `None`, the working
# directory of the parent process will be used.
#working_directory: None

# Offer IPC using `alacritty msg` (unix only)
#ipc_socket: true

#mouse:
  # Click settings
  #
  # The `double_click` and `triple_click` settings control the time
  # alacritty should wait for accepting multiple clicks as one double
  # or triple click.
  #double_click: { threshold: 300 }
  #triple_click: { threshold: 300 }

  # If this is `true`, the cursor is temporarily hidden when typing.
  #hide_when_typing: false

# Hints
#
# Terminal hints can be used to find text or hyperlink in the visible part of
# the terminal and pipe it to other applications.
#hints:
  # Keys used for the hint labels.
  #alphabet: "jfkdls;ahgurieowpq"

  # List with all available hints
  #
  # Each hint must have any of `regex` or `hyperlinks` field and either an
  # `action` or a `command` field. The fields `mouse`, `binding` and
  # `post_processing` are optional.
  #
  # The `hyperlinks` option will cause OSC 8 escape sequence hyperlinks to be
  # highlighted.
  #
  # The fields `command`, `binding.key`, `binding.mods`, `binding.mode` and
  # `mouse.mods` accept the same values as they do in the `key_bindings` section.
  #
  # The `mouse.enabled` field controls if the hint should be underlined while
  # the mouse with all `mouse.mods` keys held or the vi mode cursor is above it.
  #
  # If the `post_processing` field is set to `true`, heuristics will be used to
  # shorten the match if there are characters likely not to be part of the hint
  # (e.g. a trailing `.`). This is most useful for URIs and applies only to
  # `regex` matches.
  #
  # Values for `action`:
  #   - Copy
  #       Copy the hint's text to the clipboard.
  #   - Paste
  #       Paste the hint's text to the terminal or search.
  #   - Select
  #       Select the hint's text.
  #   - MoveViModeCursor
  #       Move the vi mode cursor to the beginning of the hint.
  #enabled:
  # - regex: "(ipfs:|ipns:|magnet:|mailto:|gemini:|gopher:|https:|http:|news:|file:|git:|ssh:|ftp:)\
  #           [^\u0000-\u001F\u007F-\u009F<>\"\\s{-}\\^⟨⟩`]+"
  #   hyperlinks: true
  #   command: xdg-open
  #   post_processing: true
  #   mouse:
  #     enabled: true
  #     mods: None
  #   binding:
  #     key: U
  #     mods: Control|Shift

# Mouse bindings
#
# Mouse bindings are specified as a list of objects, much like the key
# bindings further below.
#
# To trigger mouse bindings when an application running within Alacritty
# captures the mouse, the `Shift` modifier is automatically added as a
# requirement.
#
# Each mouse binding will specify a:
#
# - `mouse`:
#
#   - Middle
#   - Left
#   - Right
#   - Numeric identifier such as `5`
#
# - `action` (see key bindings for actions not exclusive to mouse mode)
#
# - Mouse exclusive actions:
#
#   - ExpandSelection
#       Expand the selection to the current mouse cursor location.
#
# And optionally:
#
# - `mods` (see key bindings)
#mouse_bindings:
#  - { mouse: Right,                 action: ExpandSelection }
#  - { mouse: Right,  mods: Control, action: ExpandSelection }
#  - { mouse: Middle, mode: ~Vi,     action: PasteSelection  }

# Key bindings
#
# Key bindings are specified as a list of objects. For example, this is the
# default paste binding:
#
# `- { key: V, mods: Control|Shift, action: Paste }`
#
# Each key binding will specify a:
#
# - `key`: Identifier of the key pressed
#
#    - A-Z
#    - F1-F24
#    - Key0-Key9
#
#    A full list with available key codes can be found here:
#    https://docs.rs/winit/*/winit/event/enum.VirtualKeyCode.html#variants
#
#    Instead of using the name of the keys, the `key` field also supports using
#    the scancode of the desired key. Scancodes have to be specified as a
#    decimal number. This command will allow you to display the hex scancodes
#    for certain keys:
#
#       `showkey --scancodes`.
#
# Then exactly one of:
#
# - `chars`: Send a byte sequence to the running application
#
#    The `chars` field writes the specified string to the terminal. This makes
#    it possible to pass escape sequences. To find escape codes for bindings
#    like `PageUp` (`"\x1b[5~"`), you can run the command `showkey -a` outside
#    of tmux. Note that applications use terminfo to map escape sequences back
#    to keys. It is therefore required to update the terminfo when changing an
#    escape sequence.
#
# - `action`: Execute a predefined action
#
#   - ToggleViMode
#   - SearchForward
#       Start searching toward the right of the search origin.
#   - SearchBackward
#       Start searching toward the left of the search origin.
#   - Copy
#   - Paste
#   - IncreaseFontSize
#   - DecreaseFontSize
#   - ResetFontSize
#   - ScrollPageUp
#   - ScrollPageDown
#   - ScrollHalfPageUp
#   - ScrollHalfPageDown
#   - ScrollLineUp
#   - ScrollLineDown
#   - ScrollToTop
#   - ScrollToBottom
#   - ClearHistory
#       Remove the terminal's scrollback history.
#   - Hide
#       Hide the Alacritty window.
#   - Minimize
#       Minimize the Alacritty window.
#   - Quit
#       Quit Alacritty.
#   - ToggleFullscreen
#   - SpawnNewInstance
#       Spawn a new instance of Alacritty.
#   - CreateNewWindow
#       Create a new Alacritty window from the current process.
#   - ClearLogNotice
#       Clear Alacritty's UI warning and error notice.
#   - ClearSelection
#       Remove the active selection.
#   - ReceiveChar
#   - None
#
# - Vi mode exclusive actions:
#
#   - Open
#       Perform the action of the first matching hint under the vi mode cursor
#       with `mouse.enabled` set to `true`.
#   - ToggleNormalSelection
#   - ToggleLineSelection
#   - ToggleBlockSelection
#   - ToggleSemanticSelection
#       Toggle semantic selection based on `selection.semantic_escape_chars`.
#   - CenterAroundViCursor
#       Center view around vi mode cursor
#
# - Vi mode exclusive cursor motion actions:
#
#   - Up
#       One line up.
#   - Down
#       One line down.
#   - Left
#       One character left.
#   - Right
#       One character right.
#   - First
#       First column, or beginning of the line when already at the first column.
#   - Last
#       Last column, or beginning of the line when already at the last column.
#   - FirstOccupied
#       First non-empty cell in this terminal row, or first non-empty cell of
#       the line when already at the first cell of the row.
#   - High
#       Top of the screen.
#   - Middle
#       Center of the screen.
#   - Low
#       Bottom of the screen.
#   - SemanticLeft
#       Start of the previous semantically separated word.
#   - SemanticRight
#       Start of the next semantically separated word.
#   - SemanticLeftEnd
#       End of the previous semantically separated word.
#   - SemanticRightEnd
#       End of the next semantically separated word.
#   - WordLeft
#       Start of the previous whitespace separated word.
#   - WordRight
#       Start of the next whitespace separated word.
#   - WordLeftEnd
#       End of the previous whitespace separated word.
#   - WordRightEnd
#       End of the next whitespace separated word.
#   - Bracket
#       Character matching the bracket at the cursor's location.
#   - SearchNext
#       Beginning of the next match.
#   - SearchPrevious
#       Beginning of the previous match.
#   - SearchStart
#       Start of the match to the left of the vi mode cursor.
#   - SearchEnd
#       End of the match to the right of the vi mode cursor.
#
# - Search mode exclusive actions:
#   - SearchFocusNext
#       Move the focus to the next search match.
#   - SearchFocusPrevious
#       Move the focus to the previous search match.
#   - SearchConfirm
#   - SearchCancel
#   - SearchClear
#       Reset the search regex.
#   - SearchDeleteWord
#       Delete the last word in the search regex.
#   - SearchHistoryPrevious
#       Go to the previous regex in the search history.
#   - SearchHistoryNext
#       Go to the next regex in the search history.
#
# - macOS exclusive actions:
#   - ToggleSimpleFullscreen
#       Enter fullscreen without occupying another space.
#
# - Linux/BSD exclusive actions:
#
#   - CopySelection
#       Copy from the selection buffer.
#   - PasteSelection
#       Paste from the selection buffer.
#
# - `command`: Fork and execute a specified command plus arguments
#
#    The `command` field must be a map containing a `program` string and an
#    `args` array of command line parameter strings. For example:
#       `{ program: "alacritty", args: ["-e", "vttest"] }`
#
# And optionally:
#
# - `mods`: Key modifiers to filter binding actions
#
#    - Command
#    - Control
#    - Option
#    - Super
#    - Shift
#    - Alt
#
#    Multiple `mods` can be combined using `|` like this:
#       `mods: Control|Shift`.
#    Whitespace and capitalization are relevant and must match the example.
#
# - `mode`: Indicate a binding for only specific terminal reported modes
#
#    This is mainly used to send applications the correct escape sequences
#    when in different modes.
#
#    - AppCursor
#    - AppKeypad
#    - Search
#    - Alt
#    - Vi
#
#    A `~` operator can be used before a mode to apply the binding whenever
#    the mode is *not* active, e.g. `~Alt`.
#
# Bindings are always filled by default, but will be replaced when a new
# binding with the same triggers is defined. To unset a default binding, it can
# be mapped to the `ReceiveChar` action. Alternatively, you can use `None` for
# a no-op if you do not wish to receive input characters for that binding.
#
# If the same trigger is assigned to multiple actions, all of them are executed
# in the order they were defined in.
#key_bindings:
  #- { key: Paste,                                       action: Paste          }
  #- { key: Copy,                                        action: Copy           }
  #- { key: L,         mods: Control,                    action: ClearLogNotice }
  #- { key: L,         mods: Control, mode: ~Vi|~Search, chars: "\x0c"          }
  #- { key: PageUp,    mods: Shift,   mode: ~Alt,        action: ScrollPageUp   }
  #- { key: PageDown,  mods: Shift,   mode: ~Alt,        action: ScrollPageDown }
  #- { key: Home,      mods: Shift,   mode: ~Alt,        action: ScrollToTop    }
  #- { key: End,       mods: Shift,   mode: ~Alt,        action: ScrollToBottom }

  # Vi Mode
  #- { key: Space,  mods: Shift|Control, mode: ~Search,    action: ToggleViMode            }
  #- { key: Space,  mods: Shift|Control, mode: Vi|~Search, action: ScrollToBottom          }
  #- { key: Escape,                      mode: Vi|~Search, action: ClearSelection          }
  #- { key: I,                           mode: Vi|~Search, action: ToggleViMode            }
  #- { key: I,                           mode: Vi|~Search, action: ScrollToBottom          }
  #- { key: C,      mods: Control,       mode: Vi|~Search, action: ToggleViMode            }
  #- { key: Y,      mods: Control,       mode: Vi|~Search, action: ScrollLineUp            }
  #- { key: E,      mods: Control,       mode: Vi|~Search, action: ScrollLineDown          }
  #- { key: G,                           mode: Vi|~Search, action: ScrollToTop             }
  #- { key: G,      mods: Shift,         mode: Vi|~Search, action: ScrollToBottom          }
  #- { key: B,      mods: Control,       mode: Vi|~Search, action: ScrollPageUp            }
  #- { key: F,      mods: Control,       mode: Vi|~Search, action: ScrollPageDown          }
  #- { key: U,      mods: Control,       mode: Vi|~Search, action: ScrollHalfPageUp        }
  #- { key: D,      mods: Control,       mode: Vi|~Search, action: ScrollHalfPageDown      }
  #- { key: Y,                           mode: Vi|~Search, action: Copy                    }
  #- { key: Y,                           mode: Vi|~Search, action: ClearSelection          }
  #- { key: Copy,                        mode: Vi|~Search, action: ClearSelection          }
  #- { key: V,                           mode: Vi|~Search, action: ToggleNormalSelection   }
  #- { key: V,      mods: Shift,         mode: Vi|~Search, action: ToggleLineSelection     }
  #- { key: V,      mods: Control,       mode: Vi|~Search, action: ToggleBlockSelection    }
  #- { key: V,      mods: Alt,           mode: Vi|~Search, action: ToggleSemanticSelection }
  #- { key: Return,                      mode: Vi|~Search, action: Open                    }
  #- { key: Z,                           mode: Vi|~Search, action: CenterAroundViCursor    }
  #- { key: K,                           mode: Vi|~Search, action: Up                      }
  #- { key: J,                           mode: Vi|~Search, action: Down                    }
  #- { key: H,                           mode: Vi|~Search, action: Left                    }
  #- { key: L,                           mode: Vi|~Search, action: Right                   }
  #- { key: Up,                          mode: Vi|~Search, action: Up                      }
  #- { key: Down,                        mode: Vi|~Search, action: Down                    }
  #- { key: Left,                        mode: Vi|~Search, action: Left                    }
  #- { key: Right,                       mode: Vi|~Search, action: Right                   }
  #- { key: Key0,                        mode: Vi|~Search, action: First                   }
  #- { key: Key4,   mods: Shift,         mode: Vi|~Search, action: Last                    }
  #- { key: Key6,   mods: Shift,         mode: Vi|~Search, action: FirstOccupied           }
  #- { key: H,      mods: Shift,         mode: Vi|~Search, action: High                    }
  #- { key: M,      mods: Shift,         mode: Vi|~Search, action: Middle                  }
  #- { key: L,      mods: Shift,         mode: Vi|~Search, action: Low                     }
  #- { key: B,                           mode: Vi|~Search, action: SemanticLeft            }
  #- { key: W,                           mode: Vi|~Search, action: SemanticRight           }
  #- { key: E,                           mode: Vi|~Search, action: SemanticRightEnd        }
  #- { key: B,      mods: Shift,         mode: Vi|~Search, action: WordLeft                }
  #- { key: W,      mods: Shift,         mode: Vi|~Search, action: WordRight               }
  #- { key: E,      mods: Shift,         mode: Vi|~Search, action: WordRightEnd            }
  #- { key: Key5,   mods: Shift,         mode: Vi|~Search, action: Bracket                 }
  #- { key: Slash,                       mode: Vi|~Search, action: SearchForward           }
  #- { key: Slash,  mods: Shift,         mode: Vi|~Search, action: SearchBackward          }
  #- { key: N,                           mode: Vi|~Search, action: SearchNext              }
  #- { key: N,      mods: Shift,         mode: Vi|~Search, action: SearchPrevious          }

  # Search Mode
  #- { key: Return,                mode: Search|Vi,  action: SearchConfirm         }
  #- { key: Escape,                mode: Search,     action: SearchCancel          }
  #- { key: C,      mods: Control, mode: Search,     action: SearchCancel          }
  #- { key: U,      mods: Control, mode: Search,     action: SearchClear           }
  #- { key: W,      mods: Control, mode: Search,     action: SearchDeleteWord      }
  #- { key: P,      mods: Control, mode: Search,     action: SearchHistoryPrevious }
  #- { key: N,      mods: Control, mode: Search,     action: SearchHistoryNext     }
  #- { key: Up,                    mode: Search,     action: SearchHistoryPrevious }
  #- { key: Down,                  mode: Search,     action: SearchHistoryNext     }
  #- { key: Return,                mode: Search|~Vi, action: SearchFocusNext       }
  #- { key: Return, mods: Shift,   mode: Search|~Vi, action: SearchFocusPrevious   }

  # (Windows, Linux, and BSD only)
  #- { key: V,              mods: Control|Shift, mode: ~Vi,        action: Paste            }
  #- { key: C,              mods: Control|Shift,                   action: Copy             }
  #- { key: F,              mods: Control|Shift, mode: ~Search,    action: SearchForward    }
  #- { key: B,              mods: Control|Shift, mode: ~Search,    action: SearchBackward   }
  #- { key: C,              mods: Control|Shift, mode: Vi|~Search, action: ClearSelection   }
  #- { key: Insert,         mods: Shift,                           action: PasteSelection   }
  #- { key: Key0,           mods: Control,                         action: ResetFontSize    }
  #- { key: Equals,         mods: Control,                         action: IncreaseFontSize }
  #- { key: Plus,           mods: Control,                         action: IncreaseFontSize }
  #- { key: NumpadAdd,      mods: Control,                         action: IncreaseFontSize }
  #- { key: Minus,          mods: Control,                         action: DecreaseFontSize }
  #- { key: NumpadSubtract, mods: Control,                         action: DecreaseFontSize }

  # (Windows only)
  #- { key: Return,   mods: Alt,           action: ToggleFullscreen }

  # (macOS only)
  #- { key: K,              mods: Command, mode: ~Vi|~Search, chars: "\x0c"                 }
  #- { key: K,              mods: Command, mode: ~Vi|~Search, action: ClearHistory          }
  #- { key: Key0,           mods: Command,                    action: ResetFontSize         }
  #- { key: Equals,         mods: Command,                    action: IncreaseFontSize      }
  #- { key: Plus,           mods: Command,                    action: IncreaseFontSize      }
  #- { key: NumpadAdd,      mods: Command,                    action: IncreaseFontSize      }
  #- { key: Minus,          mods: Command,                    action: DecreaseFontSize      }
  #- { key: NumpadSubtract, mods: Command,                    action: DecreaseFontSize      }
  #- { key: V,              mods: Command,                    action: Paste                 }
  #- { key: C,              mods: Command,                    action: Copy                  }
  #- { key: C,              mods: Command, mode: Vi|~Search,  action: ClearSelection        }
  #- { key: H,              mods: Command,                    action: Hide                  }
  #- { key: H,              mods: Command|Alt,                action: HideOtherApplications }
  #- { key: M,              mods: Command,                    action: Minimize              }
  #- { key: Q,              mods: Command,                    action: Quit                  }
  #- { key: W,              mods: Command,                    action: Quit                  }
  #- { key: N,              mods: Command,                    action: CreateNewWindow       }
  #- { key: F,              mods: Command|Control,            action: ToggleFullscreen      }
  #- { key: F,              mods: Command, mode: ~Search,     action: SearchForward         }
  #- { key: B,              mods: Command, mode: ~Search,     action: SearchBackward        }

#debug:
  # Display the time it takes to redraw each frame.
  #render_timer: false

  # Keep the log file after quitting Alacritty.
  #persistent_logging: false

  # Log level
  #
  # Values for `log_level`:
  #   - Off
  #   - Error
  #   - Warn
  #   - Info
  #   - Debug
  #   - Trace
  #log_level: Warn

  # Renderer override.
  #   - glsl3
  #   - gles2
  #   - gles2_pure
  #renderer: None

  # Print all received window events.
  #print_events: false

  # Highlight window damage information.
  #highlight_damage: false


key_bindings:
   # Rename the current tmux window
   - { key: Comma,    mods: Command,       chars: "\x02\x2c" }
   # Select a new tmux session for the attached client interactively
   - { key: K,        mods: Command,       chars: "\x02\x73" }
   # Select window 1-9
   - { key: Key1,     mods: Command,       chars: "\x02\x31" }
   - { key: Key2,     mods: Command,       chars: "\x02\x32" }
   - { key: Key3,     mods: Command,       chars: "\x02\x33" }
   - { key: Key4,     mods: Command,       chars: "\x02\x34" }
   - { key: Key5,     mods: Command,       chars: "\x02\x35" }
   - { key: Key6,     mods: Command,       chars: "\x02\x36" }
   - { key: Key7,     mods: Command,       chars: "\x02\x37" }
   - { key: Key8,     mods: Command,       chars: "\x02\x38" }
   - { key: Key9,     mods: Command,       chars: "\x02\x39" }
   - { key: Key0,     mods: Command,       chars: "\x02\x30" }
   # Switch to last tmux session
   - { key: L,        mods: Command,       chars: "\x02\x4c" }
   - { key: LBracket, mods: Command,       chars: "\x02\x5b" }
   # Change to the previous tmux window
   - { key: LBracket, mods: Command|Shift, chars: "\x02\x70" }
   # Split the current pane into two, left and right
   - { key: D,        mods: Command,       chars: "\x02\x25" }
   # Split the current pane into two, top and bottom.
   - { key: D,        mods: Command|Shift, chars: "\x02\x22" }
   # Detach the current tmux client
   - { key: W,        mods: Command|Shift, chars: "\x02\x64" }
   # Change to the next tmux window
   - { key: RBracket, mods: Command|Shift, chars: "\x02\x6e" }
   # Type <escape>:w<enter> to save neovim
   - { key: S,        mods: Command,       chars: "\x1b\x3a\x77\x0a" }
   # Create a new tmux window
   - { key: T,        mods: Command,       chars: "\x02\x63" }
   # Break the current tmux pane out of the tmux window
   - { key: T,        mods: Command|Shift, chars: "\x02\x21" }
   # Kill the current tmux pane (and window if last pane)
   - { key: X,        mods: Command,       chars: "\x02\x78" }
   # Toggle the zoom state of the current tmux pane
   - { key: Z,        mods: Command,       chars: "\x02\x7a" }
   # Navigating Panes
   - { key: Left,     mods: Command,       chars: "\x02\x1b\x5b\x44" }
   - { key: Right,    mods: Command,       chars: "\x02\x1b\x5b\x43" }
   - { key: Down,     mods: Command,       chars: "\x02\x1b\x5b\x42" }
   - { key: Up,       mods: Command,       chars: "\x02\x1b\x5b\x41" }
   
   - { key: PageUp,   mods: Shift, action: ScrollPageUp,   mode: ~Alt }
   - { key: PageDown, mods: Shift, action: ScrollPageDown, mode: ~Alt }
   - { key: Home,     mods: Shift, action: ScrollToTop,    mode: ~Alt }
   - { key: End,      mods: Shift, action: ScrollToBottom, mode: ~Alt }

```

## Starship

```toml

# ~/.config/starship.toml
# Get editor completions based on the config schema
"$schema" = 'https://starship.rs/config-schema.json'

format = """
$username\
$hostname\
$localip\
$shlvl\
$singularity\
$kubernetes\
$directory\
$vcsh\
$git_branch\
$git_commit\
$git_state\
$git_metrics\
$git_status\
$hg_branch\
$docker_context\
$package\
$c\
$cmake\
$cobol\
$daml\
$dart\
$deno\
$dotnet\
$elixir\
$elm\
$erlang\
$golang\
$guix_shell\
$haskell\
$haxe\
$helm\
$java\
$julia\
$kotlin\
$lua\
$nim\
$nodejs\
$ocaml\
$opa\
$perl\
$php\
$pulumi\
$purescript\
$python\
$raku\
$rlang\
$red\
$ruby\
$rust\
$scala\
$swift\
$terraform\
$vlang\
$vagrant\
$zig\
$buf\
$nix_shell\
$conda\
$meson\
$spack\
$memory_usage\
$aws\
$gcloud\
$openstack\
$azure\
$env_var\
$crystal\
$custom\
$sudo\
$cmd_duration\
$line_break\
$jobs\
$battery\
$time\
$status\
$shell\
$character"""

# Inserts a blank line between shell prompts
command_timeout = 1000
add_newline = false

# Replace the "❯" symbol in the prompt with "➜"
[character] # The name of the module we are configuring is "character"
success_symbol = "[ >](bold green)" # The "success_symbol" segment is being set to "➜" with the color "bold green"
error_symbol = "[ >](bold red)"

[directory]
format = "[$path]($style)"
truncation_length = 3

[git_status]
format = '([\[$all_status$ahead_behind\]]($style))'
conflicted = "🤔"
ahead = "🏎💨"
behind = "😰"
diverged = "😵"
up_to_date = ""
untracked = "🤷"
stashed = "📦"
modified = "📝"
staged = '[++\($count\)](green)'
renamed = "👅"
deleted = "🗑"

[aws]
format = '\[[$symbol($profile)(\($region\))(\[$duration\])]($style)\]'
disabled = true

[c]
format = '\[[$symbol($version(-$name))]($style)\]'
disabled = true

[cmake]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[cmd_duration]
format = '\[[⌛️$duration]($style)\]'
# format = '\[[$duration]($style)\]'

[cobol]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[conda]
format = '\[[$symbol$environment]($style)\]'
disabled = true

[crystal]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[dart]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[deno]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[docker_context]
format = '\[[$symbol$context]($style)\]'

[dotnet]
format = '\[[$symbol($version)(🎯 $tfm)]($style)\]'
disabled = true

[elixir]
format = '\[[$symbol($version \(OTP $otp_version\))]($style)\]'
disabled = true

[elm]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[erlang]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[gcloud]
format = '\[[$symbol$account(@$domain)(\($region\))]($style)\]'
disabled = true

[git_branch]
format = '\[[$branch]($style)\]'

[golang]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[haskell]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[helm]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[hg_branch]
format = '\[[$symbol$branch]($style)\]'
disabled = true

[java]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[julia]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[kotlin]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[kubernetes]
format = '\[[$symbol$context( \($namespace\))]($style)\]'
disabled = true

[line_break]
disabled = true

[localip]
ssh_only = true	# Only show IP address when connected to an SSH session.
format = '[$localipv4]($style) ' # The format for the module.
style = 'bold yellow' # The style for the module.
#Disables the localip module.
# disabled = false

[lua]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[memory_usage]
format = '\[$symbol[$ram( | $swap)]($style)\]'
disabled = true

[nim]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[nix_shell]
format = '\[[$symbol$state( \($name\))]($style)\]'
disabled = true

[nodejs]
format = '\[[🤖 ($version)]($style)\]'
disabled = true

[ocaml]
format = '\[[$symbol($version)(\($switch_indicator$switch_name\))]($style)\]'
disabled = true

[openstack]
format = '\[[$symbol$cloud(\($project\))]($style)\]'
disabled = true

[package]
format = '\[[$symbol$version]($style)\]'
disabled = true

[perl]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[php]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[pulumi]
format = '\[[$symbol$stack]($style)\]'
disabled = true

[purescript]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[python]
format = '\[[${symbol}${pyenv_prefix}(${version})(\($virtualenv\))]($style)\]'
disabled = true

[red]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[ruby]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[rust]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[singularity]
format = '[📦 \[$env\]]($style) '
disabled = true

[scala]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[spack]
format = '\[[$symbol$environment]($style)\]'
disabled = true

[sudo]
format = '\[[as $symbol]\]'

[swift]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[terraform]
format = '\[[$symbol$workspace]($style)\]'
disabled = true

[time]
format = '\[[$symbol$time]($style)\]'
disabled = true

[username]
format = '\[[$user]($style)\]'
disabled = true

[vagrant]
format = '\[[$symbol($version)]($style)\]'
disabled = true

[vlang]
disabled = true

[zig]
format = '\[[$symbol($version)]($style)\]'
```

## tmux


```
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1

set -g visual-activity off
set -g visual-bell off
set -g visual-silence off
setw -g monitor-activity off
set -g bell-action none

#  modes
setw -g clock-mode-colour colour5
setw -g mode-style 'fg=colour1 bg=colour18 bold'

# panes
set -g pane-border-style 'fg=colour19 bg=colour0'
set -g pane-active-border-style 'bg=colour0 fg=colour9'

# statusbar
set -g status-position bottom
set -g status-justify left
set -g status-style 'bg=colour18 fg=colour137 dim'
set -g status-left ''
set -g status-right '#[fg=colour233,bg=colour19] %d/%m #[fg=colour233,bg=colour8] %H:%M:%S '
set -g status-right-length 50
set -g status-left-length 20

# window
setw -g window-status-current-style 'fg=colour1 bg=colour19 bold'
setw -g window-status-current-format ' #I#[fg=colour249]:#[fg=colour255]#W#[fg=colour249]#F '
setw -g window-status-style 'fg=colour9 bg=colour18'
setw -g window-status-format ' #I#[fg=colour237]:#[fg=colour250]#W#[fg=colour244]#F '
setw -g window-status-bell-style 'fg=colour255 bg=colour1 bold'

# messages
set -g message-style 'fg=colour232 bg=colour16 bold'
```