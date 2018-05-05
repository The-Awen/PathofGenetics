extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate serde_derive;

use std::path::Path;
use std::fs::File;
use std::io::prelude::*;
use std::collections::HashMap;
use serde_json::{Value, Error};

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
    let tree_path = Path::new("Data/SkillTree.txt").as_os_str();
    let mut f = File::open(tree_path).expect("File not found");

    let mut contents = String::new();
    f.read_to_string(&mut contents).expect("Error reading file.");
    
    let deserialized: Parent = serde_json::from_str(&contents).unwrap();

    let mut adjacencies: HashMap<u32, Vec<u32>> = HashMap::new();

    for node in deserialized.nodes {
        adjacencies.insert(node.id, node.out);
    }

    println!("{:#?}", adjacencies);

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
        if value.len() <= 1 {
            let mut value_string = value[0]to_string();
        }
        else {
            for v in value[1..]{
                value_string = [value_string, v.to_string()].join(",");
            }
        }
        let line = [key.to_string(), " -> ".to_string(), value_string, "\n".to_string()].join("");
        buffer.write(line.as_bytes());
    }
    buffer.write(b"}\n").unwrap();
}
