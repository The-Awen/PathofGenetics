use json_structs::*;
use rand;
use rsgenetic::pheno::*;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::rc::Rc;

pub struct MyFitness {
    f: f64,
}
impl Eq for MyFitness {}
impl PartialEq for MyFitness {
    fn eq(&self, other: &MyFitness) -> bool {
        (self.f - other.f).abs() < 1e-4
    }
}
impl PartialOrd for MyFitness {
    fn partial_cmp(&self, other: &MyFitness) -> Option<Ordering> {
        self.f.partial_cmp(&other.f)
    }
}
impl Ord for MyFitness {
    fn cmp(&self, other: &MyFitness) -> Ordering {
        self.partial_cmp(other).unwrap_or_else(|| Ordering::Equal)
    }
}

impl Fitness for MyFitness {
    fn zero() -> MyFitness {
        MyFitness { f: 0.0 }
    }

    fn abs_diff(&self, other: &MyFitness) -> MyFitness {
        MyFitness {
            f: (self.f - other.f).abs(),
        }
    }
}

// TODO: maybe this should be rolled into genetic_algorithm::PassiveSkillTree?
pub struct MyData {
    pub tree_string: String,
    pub tree_nodes: Vec<u16>,
    pub decisions: Vec<u16>,
    pub tree_constants: Rc<TreeConstants>,
}

#[derive(Clone)]
pub struct TreeConstants {
    pub version: u32,
    pub player_class: PlayerClass,
    pub ascendant_class_id: u8,
    pub adjacencies: HashMap<u16, Vec<u16>>,
    pub possible_starts: Vec<u16>,
}

impl Phenotype<MyFitness> for MyData {
    fn fitness(&self) -> MyFitness {
        MyFitness {
            // TODO: replace with Path of Building damage calc
            // For now, maximize number of strength nodes
            f: 1_f64,
            //f: rand::random::<f64>(),
        }
    }

    fn crossover(&self, other: &MyData) -> MyData {
        // crossover as a random split in the decisions
        // here the crossover is average
        let mut vec: Vec<u16> = self.decisions.clone();
        let rand_idx = rand::random::<usize>() % vec.len();
        let vec2 = vec.split_off(rand_idx);

        let mut vec3: Vec<u16> = other.decisions.clone();
        let vec4 = vec3.split_off(rand_idx);

        vec.extend_from_slice(&vec4);
        vec3.extend_from_slice(&vec2);

        let decisions = match rand::random::<u16>() % 2 {
            1 => vec,
            _ => vec3,
        };

        let tree_nodes = get_nodes(
            &self.tree_constants.adjacencies,
            &self.tree_constants.possible_starts,
            &decisions,
        );

        let tree_string = PassiveSkillTree::new(
            self.tree_constants.version,
            self.tree_constants.player_class.clone(),
            self.tree_constants.ascendant_class_id,
            tree_nodes.clone(),
        ).to_string();

        MyData {
            tree_constants: self.tree_constants.clone(),
            tree_string: tree_string,
            tree_nodes: tree_nodes,
            decisions: decisions,
        }
    }

    fn mutate(&self) -> MyData {
        // TODO: how should we mutate? just flip a bit?
        // How to determine what is a valid tree mutation?
        // If we can determine valid tree mutations, invalid mutated trees
        // can just die
        //
        // FOR NOW, NO MUTATION
        /*
        let idx = rand::random::<usize>() % (self.decisions.len() + 1) / 2;
        let mut new_decisions = self.decisions.clone();
        let val = self.decisions[idx] + 1;
        new_decisions[idx] = val;

        // TODO: get tree_nodes
        let tree_nodes: Vec<u16> = Vec::new();
        let tree_string: String = String::new();
        */
        self.clone()
    }
}

impl Clone for MyData {
    fn clone(&self) -> MyData {
        MyData {
            tree_constants: self.tree_constants.clone(),
            tree_string: self.tree_string.clone(),
            tree_nodes: self.tree_nodes.clone(),
            decisions: self.decisions.clone(),
        }
    }
}

// Generate a random tree. The possible_starts refers to a specified class
// Returns (the tree nodes, the decisions to read that node, based on sorted
// possible_next ids)
pub fn gen_random_tree(
    adjacencies: &HashMap<u16, Vec<u16>>,
    possible_starts: &Vec<u16>,
    threshold: u16,
) -> (Vec<u16>, Vec<u16>) {
    let mut cur_tree: Vec<u16> = Vec::new();
    let mut decisions: Vec<u16> = Vec::new();
    let mut count = 0;
    let mut sorted_starts: Vec<u16> = possible_starts.clone();
    sorted_starts.sort();
    let mut possible_nexts: Vec<u16> = Vec::new();

    // roll a random number to choose possible start
    let rand_roll = rand::random::<usize>() % sorted_starts.len();

    // allocate that node
    cur_tree.push(sorted_starts[rand_roll]);
    decisions.push(rand_roll as u16);
    count += 1;

    while count < threshold {
        let last_idx: usize = cur_tree.len() - 1;
        let adj_idx: u16 = cur_tree[last_idx];
        // find that node's adjacencies: ie: next possible nodes
        for i in adjacencies[&adj_idx].clone().iter_mut() {
            possible_nexts.push(*i);
        }

        // don't choose previously allocated nodes as possibilities
        possible_nexts.retain(|&x| !cur_tree.contains(&x));

        // exit if no further choices from this node
        if possible_nexts.len() == 0 {
            return (cur_tree, decisions);
        }

        // sort possible_nexts
        possible_nexts.sort();

        // roll again
        let rand_roll = rand::random::<usize>() % possible_nexts.len();

        // allocate new random choice
        cur_tree.push(possible_nexts[rand_roll]);
        decisions.push(rand_roll as u16);

        count += 1
    }

    (cur_tree, decisions)
}

// TODO: rebuild a tree from its roots via decisions, mapping decisions -> tree_nodes
//
pub fn get_nodes(
    adjacencies: &HashMap<u16, Vec<u16>>,
    possible_starts: &Vec<u16>,
    decisions: &Vec<u16>,
) -> Vec<u16> {
    let mut tree_nodes: Vec<u16> = Vec::new();
    let mut possible_nexts: Vec<u16> = Vec::new();

    // initialize possible_nexts with possible_starts
    possible_nexts.extend_from_slice(&possible_starts);

    // follow directions one step at a time
    for decision in decisions {
        possible_nexts.sort();

        // allocate that node
        let mut modded_decision = *decision % possible_nexts.len() as u16;
        tree_nodes.push(possible_nexts[modded_decision as usize]);

        let last_idx: usize = tree_nodes.len() - 1;
        let adj_idx: u16 = tree_nodes[last_idx];
        // find that node's adjacencies: ie: next possible nodes
        for i in adjacencies[&adj_idx].clone().iter() {
            possible_nexts.push(*i);
        }

        // exit if no further choices from this node
        if possible_nexts.len() == 0 {
            return tree_nodes;
        }

        // don't choose previously allocated nodes as possibilities
        possible_nexts.retain(|&x| !tree_nodes.contains(&x));
    }

    tree_nodes
}
// TODO: need function that returns the hashed string, send over socket
