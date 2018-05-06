use serde;
use serde_json;
use serde_derive;

use std::path::Path;
use std::fs::File;
use std::io::prelude::*;
use std::collections::HashMap;


#[derive(Debug, Serialize, Deserialize)]
pub struct Parent {
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
pub struct Node {
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

// Build a hashmap mapping each node to its adjacent nodes. This double-connects
// each node such that the value of the map 
pub fn calculate_adjacencies(parent: &Parent) -> HashMap<u32, Vec<u32>> {
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

pub fn get_json(filepath: &str) -> Parent {
	let tree_path = Path::new(&filepath).as_os_str();
    let mut f = File::open(tree_path).expect("File not found");

    let mut contents = String::new();
    f.read_to_string(&mut contents).expect("Error reading file.");
    
    serde_json::from_str(&contents).unwrap()
}

pub fn write_adjacency_file(adjacencies: HashMap<String, Vec<u32>>) {
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



// Given some ID, return the associated description string
pub fn get_description(id: u32, all_nodes: &Vec<Node>) -> String {
    let mut description: String = String::new();
    for node in all_nodes {
        if node.id == id {
            description = node.dn.clone();
        }
    }

    description
}

pub fn get_starts(adjacencies: &HashMap<u32, Vec<u32>>, 
              deserialized: Parent) -> HashMap<String, Vec<u32>> {

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

    start_ids
}

