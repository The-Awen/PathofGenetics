#![feature(vec_remove_item)]

extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;
extern crate rand;
extern crate rsgenetic;

extern crate base64;
extern crate byteorder;

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
    
    let class_id: u8 = 0; 
    let ascendant_class_id: u8 = 0; 
    let class_name: String = "DUELIST".to_string();
    let version: u32 = 4;

    let threshold: u16 = 98; // number of nodes to make
    let (tree_nodes, decisions): (Vec<u16>, Vec<u16>) = gen_random_tree(&adjacencies, 
                                                          &start_ids[&class_name],
                                                          threshold);

    println!("{:?}\n{:?}", tree_nodes, decisions);

    println!("Lengths: {}, {}", tree_nodes.len(), decisions.len());

    // ********** CONVERT TO PASSIVE TREE LINK ********** \\ 
    let mut passive_skill_tree: PassiveSkillTree = PassiveSkillTree::new(version,
                                                            class_id,
                                                            ascendant_class_id,
                                                            tree_nodes);
    println!("{:?}", passive_skill_tree.to_string());

}
