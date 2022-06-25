
# 0. Preface

This post is about the solution to the CS110L.
This course's lab has very good instructions, so I will not write many steps in detail.

# 1. Week1
## Part 1: Getting oriented

It is easy to install the toolchain by using the rustup.

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

```rust
fn main() {
    println!("Hello, I'm Chasing");
}
```

## Part 2: Rust warmup

```rust
/*
Implement add_n, which takes a vector of numbers and some number n.
The function should return a new vector whose elements are the numbers
in the original vector v with n added to each number.
*/
fn add_n(v: Vec<i32>, n: i32) -> Vec<i32> {
    let mut newv = vec![];
    for i in v.iter() {
        newv.push(i + n);
    }
    newv
}
```

```rust
/*
Implement add_n_inplace, which does the same thing as add_n,
but modifies v directly (in place) and does not return anything.
*/
fn add_n_inplace(v: &mut Vec<i32>, n: i32) {
    v.iter_mut().for_each(|i| *i += n);
}

fn add_n_inplace2(v: &mut Vec<i32>, n: i32) {
    for i in 0..v.len() {
        v[i] = v[i] + n;
    }
}
```

function defup2 might not pass the test as expected, because the order of the vec will be random.

```rust
/*
Implement dedup that removes duplicate elements from a vector in-place (i.e. modifies v directly).
If an element is repeated anywhere in the vector, you should keep the element 
that appears first. You may want to use a HashSet for this.
*/
fn dedup(v: &mut Vec<i32>) {
    let mut set = HashSet::new();
    v.retain(|e| set.insert(*e));
}

// Note Vec#dedup only removes consecutive elements from a vector
fn dedup2(v: &mut Vec<i32>) {
    let set: HashSet<_> = v.drain(..).collect(); // dedup
    v.extend(set.into_iter());
}

```

## Part 3: Hangman

```rust
extern crate rand;
use rand::Rng;
use std::fs;
use std::io;
use std::io::Write;
use std::iter;

const NUM_INCORRECT_GUESSES: u32 = 5;
const WORDS_PATH: &str = "words.txt";

fn pick_a_random_word() -> String {
    let file_string = fs::read_to_string(WORDS_PATH).expect("Unable to read file.");
    let words: Vec<&str> = file_string.split('\n').collect();
    String::from(words[rand::thread_rng().gen_range(0..words.len())].trim())
}

fn vec_to_string(v: &Vec<char>) -> String {
    v.into_iter().collect()
}

fn main() {
    let secret_word = pick_a_random_word();
    // Note: given what you know about Rust so far, it's easier to pull characters out of a
    // vector than it is to pull them out of a string. You can get the ith character of
    // secret_word by doing secret_word_chars[i].
    let secret_word_chars: Vec<char> = secret_word.chars().collect();
    // Uncomment for debugging:
    println!("random word: {}", secret_word);

    // Your code here! :)
    println!("Welcome to CS110L Hangman!");
    let mut guess_times = 5;
    let mut word_so_far = iter::repeat('-').take(secret_word_chars.len()).collect();

    let mut guessed_letters = vec![];
    while guess_times > 0 {
        println!("The word so far is {}", vec_to_string(&word_so_far));
        println!(
            "You have guessed the following letters: {}",
            vec_to_string(&guessed_letters)
        );
        println!("You have {} guesses left", guess_times);
        print!("Please guess a letter: ");
        io::stdout().flush().expect("Error flushing stdout.");
        let mut guess = String::new();
        io::stdin()
            .read_line(&mut guess)
            .expect("Error reading line.");
        if guess.trim().len() != 1 {
            println!("Please input one letter, got {}", guess);
            continue;
        }
        let letter = guess.trim().chars().next().unwrap();
        guessed_letters.push(letter);

        let mut matched_letters = 0;
        let mut mismatched_letters = 0;
        for (i, &c) in secret_word_chars.iter().enumerate() {
            if c == letter {
                word_so_far[i] = letter;
                matched_letters += 1;
            }
            if word_so_far[i] == '-' {
                mismatched_letters += 1;
            }
        }
        if mismatched_letters == 0 {
            println!(
                "\nCongratulations you guessed the secret word: {}",
                vec_to_string(&word_so_far)
            );
            break;
        }
        if matched_letters == 0 {
            println!("Sorry, that letter is not in the word");
            guess_times -= 1;
            if guess_times == 0 {
                println!("\nSorry, you ran out of guesses!");
            }
        }
        println!("");
    }
}
```

# 2. Week2

## Part 2: rdiff

```rust
// Grid implemented as flat vector
pub struct Grid {
    num_rows: usize,
    num_cols: usize,
    elems: Vec<usize>,
}

impl Grid {
    /// Returns a Grid of the specified size, with all elements pre-initialized to zero.
    pub fn new(num_rows: usize, num_cols: usize) -> Grid {
        Grid {
            num_rows: num_rows,
            num_cols: num_cols,
            // This syntax uses the vec! macro to create a vector of zeros, initialized to a
            // specific length
            // https://stackoverflow.com/a/29530932
            elems: vec![0; num_rows * num_cols],
        }
    }

    pub fn size(&self) -> (usize, usize) {
        (self.num_rows, self.num_cols)
    }

    /// Returns the element at the specified location. If the location is out of bounds, returns
    /// None.
    ///
    /// Note to students: this function also could have returned Result. It's a matter of taste in
    /// how you define the semantics; many languages raise exceptions for out-of-bounds exceptions,
    /// but others argue that makes code needlessly complex. Here, we decided to return Option to
    /// give you more practice with Option :) and because this similar library returns Option:
    /// https://docs.rs/array2d/0.2.1/array2d/struct.Array2D.html
    pub fn get(&self, row: usize, col: usize) -> Option<usize> {
        if row >= self.num_rows || col >= self.num_cols {
            None
        } else {
            Some(self.elems[row * self.num_cols + col])
        }
    }

    /// Sets the element at the specified location to the specified value. If the location is out
    /// of bounds, returns Err with an error message.
    pub fn set(&mut self, row: usize, col: usize, val: usize) -> Result<(), &'static str> {
        if row >= self.num_rows || col >= self.num_cols {
            Err("index out of bounds")
        } else {
            self.elems[row * self.num_cols + col] = val;
            Ok(())
        }
    }

    /// Prints a visual representation of the grid. You can use this for debugging.
    pub fn display(&self) {
        for row in 0..self.num_rows {
            let mut line = String::new();
            for col in 0..self.num_cols {
                line.push_str(&format!("{}, ", self.get(row, col).unwrap()));
            }
            println!("{}", line);
        }
    }

    /// Resets all the elements to zero.
    pub fn clear(&mut self) {
        for i in self.elems.iter_mut() {
            *i = 0;
        }
    }
}
```

```rust
use grid::Grid;
use std::cmp::max;
// For lcs()
use std::env;
use std::fs::File; // For read_file_lines()
use std::io::{self, BufRead}; // For read_file_lines()
use std::process;

pub mod grid;

/// Reads the file at the supplied path, and returns a vector of strings.
fn read_file_lines(filename: &String) -> Result<Vec<String>, io::Error> {
    let mut lines: Vec<String> = Vec::new();
    let file = File::open(filename).unwrap();
    for line in io::BufReader::new(file).lines() {
        let line_str = line?;
        lines.push(line_str);
    }
    Ok(lines)
}

fn lcs(seq1: &Vec<String>, seq2: &Vec<String>) -> Grid {
    // Note: Feel free to use unwrap() in this code, as long as you're basically certain it'll
    // never happen. Conceptually, unwrap() is justified here, because there's not really any error
    // condition you're watching out for (i.e. as long as your code is written correctly, nothing
    // external can go wrong that we would want to handle in higher-level functions). The unwrap()
    // calls act like having asserts in C code, i.e. as guards against programming error.
    let m = seq1.len();
    let n = seq2.len();
    let mut g = Grid::new(m + 1, n + 1);
    for i in 0..m {
        g.set(i, 0, 0).unwrap();
    }
    for j in 0..n {
        g.set(0, j, 0).unwrap();
    }

    for i in 0..m {
        for j in 0..n {
            if seq1[i] == seq2[j] {
                g.set(i + 1, j + 1, g.get(i, j).unwrap() + 1).unwrap();
            } else {
                g.set(
                    i + 1,
                    j + 1,
                    max(g.get(i + 1, j).unwrap(), g.get(i, j + 1).unwrap()),
                )
                .unwrap();
            }
        }
    }
    g
}

// if i > 0 and j > 0 and X[i-1] = Y[j-1]
//         print_diff(C, X, Y, i-1, j-1)
//         print "  " + X[i-1]
//     else if j > 0 and (i = 0 or C[i,j-1] ≥ C[i-1,j])
//         print_diff(C, X, Y, i, j-1)
//         print "> " + Y[j-1]
//     else if i > 0 and (j = 0 or C[i,j-1] < C[i-1,j])
//         print_diff(C, X, Y, i-1, j)
//         print "< " + X[i-1]
//     else
//         print ""
fn print_diff(lcs_table: &Grid, lines1: &Vec<String>, lines2: &Vec<String>, i: usize, j: usize) {
    if i > 0 && j > 0 && lines1[i - 1] == lines2[j - 1] {
        print_diff(lcs_table, lines1, lines2, i - 1, j - 1);
        println!("  {}", lines1[i - 1]);
    } else if j > 0
        && (i == 0 || lcs_table.get(i, j - 1).unwrap() >= lcs_table.get(i - 1, j).unwrap())
    {
        print_diff(lcs_table, lines1, lines2, i, j - 1);
        println!("> {}", lines2[j - 1]);
    } else if i > 0
        && (j == 0 || lcs_table.get(i, j - 1).unwrap() < lcs_table.get(i - 1, j).unwrap())
    {
        print_diff(lcs_table, lines1, lines2, i - 1, j);
        println!("< {}", lines1[i - 1]);
    } 
}

fn main() {
    // cargo run simple-a.txt simple-b.txt  
    // cargo run handout-a.txt handout-b.txt
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        println!("Too few arguments.");
        process::exit(1);
    }
    let filename1 = &args[1];
    let filename2 = &args[2];

    let lines1 = read_file_lines(filename1).expect("read_file_lines err");
    let lines2 = read_file_lines(filename2).expect("read_file_lines err");
    let mut grid = lcs(&lines1, &lines2);

    print_diff(&grid, &lines1, &lines2, lines1.len(), lines2.len());
}
```

# 3. Week3
## Part 1: Inspecting File Descriptors
wip