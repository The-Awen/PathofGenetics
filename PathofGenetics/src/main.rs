extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate serde_derive;

use std::collections::HashMap;
use serde_json::{Value, Error};

#[derive(Debug, Serialize)]
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
    skillSprites: Vec<SkillSprite>,
    imageZoomLevels: Vec<f32>,
}

#[derive(Debug, Serialize)]
struct CharacterData {
    base_str: u32,
    base_dex: u32,
    base_int: u32,
}

#[derive(Debug, Serialize)]
struct Group {
    x: f32,
    y: f32,
    oo: OO, // TODO: figure out how serde handles multiple types for the same name
    // here we have possibilities as jsons, or lists of bools
    n: Vec<u32>,
}

#[derive(Debug, Serialize)]
struct Root {
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    out: Vec<u32>,
}

#[derive(Debug, Serialize)]
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
    spc: Vec<String>,
    sd: Vec<String>,
    g: u32,
    o: u32,
    oidx: u32,
    sa: u32,
    da: u32,
    ia: u32,
    out: Vec<u32>,
}

#[derive(Debug, Serialize)]
struct Constants {
    classes: HashMap<String, u32>,
    characterAttributes: HashMap<String, u32>,
    PSSCentreInnerRadius: u32,
    skillsPerOrbit: Vec<u32>,
    orbitRadii: Vec<u32>,
}



fn main() {
    println!("Hello, world!");
}
