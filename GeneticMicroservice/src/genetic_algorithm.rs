use rand;
use std::collections::HashMap;

use json_structs::*;

use rand::distributions::{IndependentSample, Range};
use rsgenetic::pheno::*;
use rsgenetic::sim::select::*;
use rsgenetic::sim::seq::Simulator;
use rsgenetic::sim::*;
use std::cmp::Ordering;

struct MyFitness {
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

struct MyData {
    tree_nodes: Vec<u16>,
    decisions: Vec<u16>,
    strength_count: u16,
}

impl MyData {
    fn calc_fitness(node_data: HashMap<u16, Vec<Node>>) -> u16 {
        // TODO: get this going

        0_u16
    }
}

impl Phenotype<MyFitness> for MyData {
    fn fitness(&self) -> MyFitness {
        MyFitness {
            // TODO: replace with Path of Building damage calc
            // For now, maximize number of strength nodes
            f: self.strength_count as f64,
        }
    }

    fn crossover(&self, other: &MyData) -> MyData {
        // crossover as a random split in the decisions
        // here the crossover is average
        let mut vec: Vec<u16> = self.decisions.clone();
        let rand_idx = rand::random::<usize>() % vec.len();
        let mut vec2 = vec.split_off(rand_idx);
        let decisions = match rand::random::<u16>() % 2 {
            1 => vec,
            _ => vec2,
        };

        let TMP_NODES: HashMap<u16, Vec<Node>> = HashMap::new();
        let strength_count: u16 = MyData::calc_fitness(TMP_NODES);
        let tree_nodes: Vec<u16> = Vec::new();
        MyData {
            tree_nodes: tree_nodes,
            decisions: decisions,
            strength_count: strength_count,
        }
    }

    fn mutate(&self) -> MyData {
        // TODO: how should we mutate? just flip a bit?
        // How to determine what is a valid tree mutation?
        // If we can determine valid tree mutations, invalid mutated trees
        // can just die
        // temporarily will just randomly add 1 to a decision
        let idx = rand::random::<usize>() % self.decisions.len();
        let mut new_decisions = self.decisions.clone();
        let val = self.decisions[idx] + 1;
        new_decisions[idx] = val;
        let tree_nodes: Vec<u16> = Vec::new();
        MyData {
            tree_nodes: tree_nodes,
            decisions: new_decisions,
            strength_count: 0_u16,
        }
    }
}

impl Clone for MyData {
    fn clone(&self) -> MyData {
        MyData {
            tree_nodes: self.tree_nodes.clone(),
            decisions: self.decisions.clone(),
            strength_count: self.strength_count,
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

// TODO: need function which parses the tree into the hashed string
// TODO: need function that returns the hashed string, send over socket