#![feature(vec_remove_item)]
#![feature(try_from)]
#![allow(dead_code)]

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

use rsgenetic::sim::select::*;
use rsgenetic::sim::seq::Simulator;
use rsgenetic::sim::*;

fn main() {
    // ********** READ TREE JSON ********** \\
    let tree_path = "Data/SkillTree.txt";
    let deserialized: Parent = get_json(tree_path);

    // ********** CALCULATE ADJACENCIES ********** \\
    let adjacencies = calculate_adjacencies(&deserialized);

    // ********** GET START POSITIONS ********** \\
    let start_ids = get_starts(&adjacencies, deserialized);

    // ********** PARAMETERS ********** \\
    let player_class: PlayerClass = PlayerClass::Witch;
    let ascendant_class_id: u8 = 1;
    let class_name: String = "WITCH".to_string();
    let version: u32 = 4;

    let threshold: u16 = 123; // number of nodes to make

    // ********** GENERATE A RANDOM TREE ********** \\
    let (tree_nodes, decisions): (Vec<u16>, Vec<u16>) =
        gen_random_tree(&adjacencies, &start_ids[&class_name], threshold);

    // ********** CONVERT TO PASSIVE TREE LINK ********** \\
    let passive_skill_tree: PassiveSkillTree = PassiveSkillTree::new(
        version,
        player_class.clone(),
        ascendant_class_id,
        tree_nodes,
    );
    println!("{:?}", passive_skill_tree.to_string());

    // ********** GENERATE RANDOM POPULATION ********** \\
    // make a population
    let max_pop: usize = 10;
    let epochs: u64 = 50;
    let mut intermediate_pop: Vec<(Vec<u16>, Vec<u16>)> = (0..max_pop)
        .map(|_i| gen_random_tree(&adjacencies, &start_ids[&class_name], threshold))
        .collect();

    let mut population: Vec<MyData> = Vec::new();

    for tree in intermediate_pop.iter_mut() {
        let tmp_passive_skill_tree = PassiveSkillTree::new(
            version,
            player_class.clone(),
            ascendant_class_id,
            tree.1.clone(),
        );
        let data_point = MyData {
            tree_string: tmp_passive_skill_tree.to_string(),
            tree_nodes: tree.0.clone(),
            decisions: tree.1.clone(),
        };
        population.push(data_point.clone());
    }

    let mut s = Simulator::builder(&mut population)
        .set_selector(Box::new(StochasticSelector::new(10)))
        .set_max_iters(epochs)
        .build();
    s.run();
    let result = s.get().unwrap();
    let time = s.time();
    println!("Execution time: {} ns.", time.unwrap());

    // convert nodes to a printable tree string
    let mut passive_skill_tree: PassiveSkillTree = PassiveSkillTree::new(
        version,
        player_class,
        ascendant_class_id,
        result.tree_nodes.clone(),
    );

    println!("{:?}", passive_skill_tree.to_string());
}
