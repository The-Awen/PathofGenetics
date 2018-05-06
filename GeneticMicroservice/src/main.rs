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

use std::rc::Rc;

fn main() {
    // ********** READ TREE JSON ********** \\
    let tree_path = "Data/SkillTree.txt";
    let deserialized: Parent = get_json(tree_path);

    // ********** PARAMETERS ********** \\
    let root_url = "http://www.pathofexile.com/passive-skill-tree/3.2.3/";
    let adjacencies = calculate_adjacencies(&deserialized);
    let node_map = get_node_map(&deserialized.nodes);
    let start_ids = get_starts(&adjacencies, deserialized);

    let player_class: PlayerClass = PlayerClass::Scion;
    let ascendant_class_id: u8 = 1;
    let class_name: String = "SCION".to_string();
    let version: u32 = 4;
    let threshold: u16 = 123; // number of nodes to make

    let tree_constants: Rc<TreeConstants> = Rc::new(TreeConstants {
        version: version,
        player_class: player_class,
        ascendant_class_id: ascendant_class_id,
        adjacencies: adjacencies,
        possible_starts: start_ids[&class_name].clone(),
        node_map: node_map.clone(),
    });

    // ********** GENERATE A RANDOM TREE ********** \\
    let (tree_nodes, _decisions): (Vec<u16>, Vec<u16>) = gen_random_tree(
        &tree_constants.adjacencies,
        &tree_constants.possible_starts,
        threshold,
    );

    // ********** CONVERT TO PASSIVE TREE LINK ********** \\
    let passive_skill_tree: PassiveSkillTree = PassiveSkillTree::new(
        tree_constants.version,
        tree_constants.player_class.clone(),
        tree_constants.ascendant_class_id,
        tree_nodes,
    );
    println!("{}{}", root_url, passive_skill_tree.to_string());

    // ********** GENERATE RANDOM POPULATION ********** \\
    // make a population
    println!("\nMaking population");
    let max_pop: usize = 20 as usize;
    let num_parents: usize = 10 as usize;
    let epochs: u64 = 1000;
    let mut intermediate_pop: Vec<(Vec<u16>, Vec<u16>)> = (0..max_pop)
        .map(|_i| {
            gen_random_tree(
                &tree_constants.adjacencies,
                &tree_constants.possible_starts,
                threshold,
            )
        })
        .collect();

    let mut population: Vec<MyData> = Vec::new();

    println!("\nGenerating data structures for crossover");
    for tree in intermediate_pop.iter_mut() {
        let tmp_passive_skill_tree = PassiveSkillTree::new(
            tree_constants.version,
            tree_constants.player_class.clone(),
            tree_constants.ascendant_class_id,
            tree.1.clone(),
        );
        let data_point = MyData {
            tree_string: tmp_passive_skill_tree.to_string(),
            tree_nodes: tree.0.clone(),
            decisions: tree.1.clone(),
            tree_constants: tree_constants.clone(),
        };
        population.push(data_point.clone());
    }

    println!("\nSimulating");
    let mut s = Simulator::builder(&mut population)
        .set_selector(Box::new(StochasticSelector::new(num_parents)))
        .set_max_iters(epochs)
        .build();
    s.run();
    let result = s.get().unwrap();
    let time = s.time();
    println!("Execution time: {:.04} s.", time.unwrap() as f32 / 1e9);

    // convert nodes to a printable tree string
    let passive_skill_tree: PassiveSkillTree = PassiveSkillTree::new(
        tree_constants.version,
        tree_constants.player_class.clone(),
        tree_constants.ascendant_class_id,
        result.tree_nodes.clone(),
    );

    println!("{}{}", root_url, passive_skill_tree.to_string());
}
