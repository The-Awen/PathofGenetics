use serde_json;

use std::collections::HashMap;
use std::fs::File;
use std::io::prelude::*;
use std::path::Path;

use base64;
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};

use std::convert::{TryFrom, TryInto};
use std::fmt;
use std::io;
use std::str::FromStr;

#[derive(Debug, Serialize, Deserialize)]
pub struct Parent {
    characterData: HashMap<u32, CharacterData>,
    groups: HashMap<u32, Group>,
    root: Root,
    pub nodes: Vec<Node>,
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
    n: Vec<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Root {
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    out: Vec<u16>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: u16,
    icon: String,
    ks: bool,
    not: bool,
    pub dn: String,
    m: bool,
    isJewelSocket: bool,
    isMultipleChoice: bool,
    isMultipleChoiceOption: bool,
    passivePointsGranted: u32,
    spc: Vec<u32>,
    pub sd: Vec<String>,
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    ia: u32,
    out: Vec<u16>,
    #[serde(default)]
    isAscendancyStart: bool,
    #[serde(default)]
    ascendancyName: String,
    #[serde(default)]
    adjacencies: Vec<u16>,
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
pub fn calculate_adjacencies(parent: &Parent) -> HashMap<u16, Vec<u16>> {
    let mut adjacencies: HashMap<u16, Vec<u16>> = HashMap::new();
    let mut ascendancy_ids: Vec<u16> = Vec::new();

    for node in &parent.nodes {
        adjacencies.insert(node.id, node.out.clone());

        if node.isAscendancyStart || node.ascendancyName.len() > 1 {
            ascendancy_ids.push(node.id);
        }
    }

    let adj_copy = adjacencies.clone();

    for (key, mut value) in adj_copy {
        for n in value {
            if !adjacencies[&n].contains(&key) {
                adjacencies.get_mut(&n).unwrap().push(key);
            }
        }
    }
    for (_key, mut value) in adjacencies.iter_mut() {
        value.retain(|&x| !ascendancy_ids.contains(&x));
    }

    adjacencies
}

pub fn get_json(filepath: &str) -> Parent {
    let tree_path = Path::new(&filepath).as_os_str();
    let mut f = File::open(tree_path).expect("File not found");

    let mut contents = String::new();
    f.read_to_string(&mut contents)
        .expect("Error reading file.");

    serde_json::from_str(&contents).unwrap()
}

pub fn write_adjacency_file(adjacencies: HashMap<String, Vec<u16>>) {
    let viz_out = Path::new("Data/visualization.txt");
    let display = viz_out.display();

    let mut buffer = match File::create(viz_out) {
        Err(why) => panic!("failed to make {}: {:?}", display, why),
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
            for v in value {
                value_string = [value_string, v.to_string()].join(",");
            }
        }
        let line = [
            key.to_string(),
            " -> ".to_string(),
            value_string,
            "\n".to_string(),
        ].join("");
        buffer.write(line.as_bytes());
    }
    buffer.write(b"}\n").unwrap();
}

// Given some ID, return the associated description string
pub fn get_description(id: u16, all_nodes: &Vec<Node>) -> String {
    let mut description: String = String::new();
    for node in all_nodes {
        if node.id == id {
            description = node.dn.clone();
        }
    }
    description
}

pub fn get_node_map(all_nodes: &Vec<Node>) -> HashMap<u16, Node> {
    let mut map: HashMap<u16, Node> = HashMap::new();
    for node in all_nodes {
        map.insert(node.id, node.clone());
    }
    map
}

pub fn get_starts(
    adjacencies: &HashMap<u16, Vec<u16>>,
    deserialized: Parent,
) -> HashMap<String, Vec<u16>> {
    // ********** GET START POSITIONS ********** \\
    // Generate a hashmap mapping CLASS_NAME : vector of ids of valid start nodes

    let mut start_ids: HashMap<String, Vec<u16>> = HashMap::new();

    let class_names = vec!["WITCH", "SIX", "RANGER", "DUELIST", "MARAUDER", "TEMPLAR"];
    let mut ascendancy_ids: Vec<u16> = Vec::new();
    for mut node in deserialized.nodes {
        if node.isAscendancyStart || node.ascendancyName.len() > 1 {
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
    let mut scion_next: Vec<u16> = deserialized.groups[&93].n.clone();
    scion_next.remove_item(&58833);
    start_ids.insert("SCION".to_string(), scion_next);
    // also remove dummy head for scion
    //start_ids[&"SCION".to_string()].remove(58833);

    ascendancy_ids.sort();

    // ********** PRUNE OUT ASCENDANCY CONNECTIONS ********** \\
    for (_key, val) in start_ids.iter_mut() {
        val.retain(|&x| !ascendancy_ids.contains(&x));
    }

    start_ids
}

#[derive(Debug, PartialEq, Clone)]
pub enum PlayerClass {
    Scion,
    Marauder,
    Ranger,
    Witch,
    Duelist,
    Templar,
    Shadow,
}

impl TryFrom<u8> for PlayerClass {
    type Error = io::Error;

    fn try_from(num: u8) -> Result<Self, Self::Error> {
        Ok(match num {
            0 => PlayerClass::Scion,
            1 => PlayerClass::Marauder,
            2 => PlayerClass::Ranger,
            3 => PlayerClass::Witch,
            4 => PlayerClass::Duelist,
            5 => PlayerClass::Templar,
            6 => PlayerClass::Shadow,
            _ => return Err(io::Error::new(io::ErrorKind::Other, "Invalid class")),
        })
    }
}

impl<'a> Into<u8> for &'a PlayerClass {
    fn into(self) -> u8 {
        match *self {
            PlayerClass::Scion => 0,
            PlayerClass::Marauder => 1,
            PlayerClass::Ranger => 2,
            PlayerClass::Witch => 3,
            PlayerClass::Duelist => 4,
            PlayerClass::Templar => 5,
            PlayerClass::Shadow => 6,
        }
    }
}

#[derive(Debug, PartialEq)]

pub struct PassiveSkillTree {
    version: u32,
    player_class: PlayerClass,
    ascendant_class_id: u8,
    node_ids: Vec<u16>,
}

impl PassiveSkillTree {
    pub fn new(
        version: u32,
        player_class: PlayerClass,
        ascendant_class_id: u8,
        node_ids: Vec<u16>,
    ) -> Self {
        PassiveSkillTree {
            version,
            player_class,
            ascendant_class_id,
            node_ids,
        }
    }
}

impl fmt::Display for PassiveSkillTree {
    fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        // Create a byte buffer

        let mut buf: Vec<u8> = Vec::with_capacity(6 + self.node_ids.len());

        // Add the version
        buf.write_u32::<BigEndian>(self.version)
            .map_err(|_| fmt::Error)?;
        buf.push((&self.player_class).into());
        buf.push(self.ascendant_class_id);
        buf.push(0);

        for node in &self.node_ids {
            buf.write_u16::<BigEndian>(*node).map_err(|_| fmt::Error)?;
        }

        // Encode the buffer as base64

        write!(
            formatter,
            "{}",
            base64::encode(&buf).replace("+", "-").replace("/", "_")
        )
    }
}

impl FromStr for PassiveSkillTree {
    type Err = io::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Parse the base64
        let buf: Vec<u8> = base64::decode(&s.replace("-", "+").replace("_", "/"))
            .map_err(|err| io::Error::new(io::ErrorKind::Other, err))?;

        // Create a cursor for reading bytes
        let mut cur = io::Cursor::new(&buf);

        // Read the version
        let version: u32 = cur.read_u32::<BigEndian>()?;

        // Read the class id, ascendant class id, and extra byte
        let player_class = cur.read_u8()?.try_into()?;
        let ascendant_class_id = cur.read_u8()?;
        cur.read_u8()?;

        // Read in the node IDS
        let mut node_ids: Vec<u16> = Vec::new();
        while let Ok(node_id) = cur.read_u16::<BigEndian>() {
            node_ids.push(node_id);
        }

        // Return the skill tree
        Ok(PassiveSkillTree {
            version,
            player_class,
            ascendant_class_id,
            node_ids,
        })
    }
}
