#![feature(vec_remove_item)]

extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;
extern crate rand;

mod json_structs;
use json_structs::*;

mod genetic_algorithm;
use genetic_algorithm::*;

use std::path::Path;
use std::fs::File;
use std::io::prelude::*;
use std::collections::HashMap;


fn main() {

    // ********** READ TREE JSON ********** \\
    let tree_path = "Data/SkillTree.txt";
    let deserialized: Parent = get_json(tree_path);

    // ********** CALCULATE ADJACENCIES ********** \\ 
    let adjacencies = calculate_adjacencies(&deserialized);

    // ********** GET START POSITIONS ********** \\ 
    let start_ids = get_starts(&adjacencies, deserialized);

    // ********** GENERATE A RANDOM TREE ********** \\ 
    let tree: Vec<u32> = gen_random_tree(&adjacencies, &start_ids[&"DUELIST".to_string()]);

    println!("{:?}", tree);

}
