#![feature(vec_remove_item)]

extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;

extern crate rand;

use std::path::Path;
use std::fs::File;
use std::io::prelude::*;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct Parent {
    characterData: HashMap<u32, CharacterData>,
    groups: HashMap<u32, Group>,
    root: Root,
    nodes: Vec<Node>,
    min_x: i32,
    min_y: i32,
    max_x: i32,
    max_y: i32,
    constants: Constants,
    imageRoot: String,
    imageZoomLevels: Vec<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CharacterData {
    base_str: u32,
    base_dex: u32,
    base_int: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Group {
    x: f32,
    y: f32,
    oo: serde_json::Value,
    n: Vec<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Root {
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    out: Vec<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Node {
    id: u32,
    icon: String,
    ks: bool,
    not: bool,
    dn: String,
    m: bool,
    isJewelSocket: bool,
    isMultipleChoice: bool,
    isMultipleChoiceOption: bool,
    passivePointsGranted: u32,
    spc: Vec<u32>,
    sd: Vec<String>,
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    ia: u32,
    out: Vec<u32>,
    #[serde(default)]
    isAscendancyStart: bool,
    #[serde(default)]
    adjacencies: Vec<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Constants {
    classes: HashMap<String, u32>,
    characterAttributes: HashMap<String, u32>,
    PSSCentreInnerRadius: u32,
    skillsPerOrbit: Vec<u32>,
    orbitRadii: Vec<u32>,
}

fn main() {

    // ********** READ TREE JSON ********** \\
    let tree_path = Path::new("Data/SkillTree.txt").as_os_str();
    let mut f = File::open(tree_path).expect("File not found");

    let mut contents = String::new();
    f.read_to_string(&mut contents).expect("Error reading file.");
    
    let deserialized: Parent = serde_json::from_str(&contents).unwrap();

    
    // ********** CALCULATE ADJACENCIES ********** \\ 

    let adjacencies = calculate_adjacencies(&deserialized);

    let first = 54307;
    let second = 12401;
    //println!("{}: {:?}, {}: {:?}", first, adjacencies[&first], second, adjacencies[&second]);


    // ********** BUILD GRAPH ********** \\ 
    //write_adjacency_file(adjacencies);


    // ********** GET START POSITIONS ********** \\ 
    // Generate a hashmap mapping CLASS_NAME : vector of ids of valid start nodes

    let mut start_ids: HashMap<String, Vec<u32>> = HashMap::new();

    let class_names = vec!["WITCH", "SIX", "RANGER", "DUELIST", "MARAUDER", "TEMPLAR"];
    let mut ascendancy_ids: Vec<u32> = Vec::new();
    for mut node in deserialized.nodes { 

        if node.isAscendancyStart {
            ascendancy_ids.push(node.id);
        }

        // ********** ADD ADJACENCIES TO NODES ********** \\ 
        node.adjacencies = adjacencies[&node.id].clone();

        if class_names.contains(&&node.dn[..]) {
            match &*node.dn {
                "SIX" => start_ids.insert("SHADOW".to_string(), node.adjacencies),
                _ => start_ids.insert(node.dn, node.adjacencies),
            };
        }
    }

    
    // group 93 has a vector called n. This is the scion start, including pathway to ascendant.
    let mut scion_next: Vec<u32> = deserialized.groups[&93].n.clone();
    scion_next.remove_item(&58833);
    start_ids.insert("SCION".to_string(), scion_next);
    // also remove dummy head for scion
    //start_ids[&"SCION".to_string()].remove(58833);

    // ********** PRUNE OUT ASCENDANCY CONNECTIONS ********** \\ 
    for (_key, val) in start_ids.iter_mut() {
       val.retain(|&x| !ascendancy_ids.contains(&x));
    }

    //println!("{:#?}", start_ids);


    let tree: Vec<u32> = gen_random_tree(adjacencies, &start_ids[&"DUELIST".to_string()]);

    println!("{:?}", tree);
}

// Build a hashmap mapping each node to its adjacent nodes. This double-connects
// each node such that the value of the map 
fn calculate_adjacencies(parent: &Parent) -> HashMap<u32, Vec<u32>> {
    let mut adjacencies: HashMap<u32, Vec<u32>> = HashMap::new();

    for node in &parent.nodes { 
        adjacencies.insert(node.id, node.out.clone());
    }

    let adj_copy = adjacencies.clone();

    for (key, value) in adj_copy {
        for n in value {
            if !adjacencies[&n].contains(&key) {
                adjacencies.get_mut(&n).unwrap().push(key);
            }
        }
    }

    adjacencies
}

fn write_adjacency_file(adjacencies: HashMap<String, Vec<u32>>) {
    let viz_out = Path::new("Data/visualization.txt");
    let display = viz_out.display();

    let mut buffer = match File::create(viz_out) {
        Err(why) => panic!("failed to make {}: {:?}",
                           display,
                           why),
        Ok(file) => file,
    };

    buffer.write(b"digraph G {\n").unwrap();

    for (key, value) in adjacencies {
        if value.len() < 1 {
            let line = [key.to_string(), " -> ".to_string(), "000\n".to_string()].join("");
            buffer.write(line.as_bytes());
            continue;
        }
        let mut value_string = value[0].to_string();
        if value.len() > 1 {
            for v in value{
                value_string = [value_string, v.to_string()].join(",");
            }
        }
        let line = [key.to_string(), " -> ".to_string(), value_string, "\n".to_string()].join("");
        buffer.write(line.as_bytes());
    }
    buffer.write(b"}\n").unwrap();

}

// Generate a random tree. The possible_starts refers to a specified class
fn gen_random_tree(adjacencies: HashMap<u32, Vec<u32>>, possible_starts: &Vec<u32>) -> Vec<u32> {

    // TODO: be able to branch out from previous trees as well, instead of the most recent one
    // this should be a pretty easy fix when handling "possible_nexts"

    let mut cur_tree: Vec<u32> = Vec::new();
    let mut count = 0;
    let THRESHOLD = 123;
    let mut possible_nexts: Vec<u32> = Vec::new();

    // roll a random number to choose possible start
    let rand_roll = rand::random::<usize>() % possible_starts.len();
    
    // allocate that node
    cur_tree.push(possible_starts[rand_roll]);
    count += 1;

    while count < THRESHOLD {

        let last_idx: usize = cur_tree.len() - 1;
        let adj_idx: u32 = cur_tree[last_idx];
        // find that node's adjacencies: ie: next possible nodes
        for i in adjacencies[&adj_idx].clone().iter_mut() {
            possible_nexts.push(*i);
        }
        
        // don't choose previously allocated nodes as possibilities
        possible_nexts.retain(|&x| !cur_tree.contains(&x));

        // exit if no further choices from this node
        if possible_nexts.len() == 0 {
            return cur_tree;
        }
        
        // roll again
        let rand_roll = rand::random::<usize>() % possible_nexts.len();

        // allocate new random choice
        cur_tree.push(possible_nexts[rand_roll]);

        count += 1
    }

    cur_tree
}
