use rand;
use std::collections::HashMap;

use rsgenetic::sim::*;
use rsgenetic::sim::seq::Simulator;
use rsgenetic::sim::select::*;
use rsgenetic::pheno::*;
use rand::distributions::{IndependentSample, Range};
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
    decisions: Vec<u32>,
    x: f64, //TODO: delete this
}

impl Phenotype<MyFitness> for MyData {
    fn fitness(&self) -> MyFitness {
        MyFitness {
            // TODO: replace with Path of Building damage calc
            f: 10.0 - ((self.x + 3.0) * (self.x + 3.0)),
        }
    }

    fn crossover(&self, other:&MyData) -> MyData {
        // crossover as a random split in the decisions
        // here the crossover is average
        let mut vec: Vec<u32> = self.decisions.clone();
        let rand_idx = rand::random::<usize>() % vec.len();
        let mut vec2 = vec.split_off(rand_idx);
        let decisions = match rand::random::<u32>() % 2 {
            1 => vec,
            _ => vec2,
        };
        MyData {
            decisions: decisions,
            x: 0.0,
        }
    }

    fn mutate(&self) -> MyData {
        // TODO: how should we mutate? just flip a bit?
        // How to determine what is a valid tree mutation?
        // If we can determine valid tree mutations, invalid mutated trees
        // can just die
        let between = Range::new(-1.0, 1.0);
        let mut rng = rand::thread_rng();
        let offset = between.ind_sample(&mut rng);
        MyData { 
            decisions: Vec::new(), 
            x: self.x + offset }
    }
}

impl Clone for MyData {
    fn clone(&self) -> MyData {
        MyData { decisions: self.decisions.clone(),
        x: 0.0,}
    }
}

// Generate a random tree. The possible_starts refers to a specified class
// Returns (the tree nodes, the decisions to read that node, based on sorted
// possible_next ids)
pub fn gen_random_tree(adjacencies: &HashMap<u32, Vec<u32>>, 
                       possible_starts: &Vec<u32>,
                       threshold: u32) -> (Vec<u32>, Vec<u32>) {

    let mut cur_tree: Vec<u32> = Vec::new();
    let mut decisions: Vec<u32> = Vec::new();
    let mut count = 0;
    let mut sorted_starts: Vec<u32> = possible_starts.clone();
    sorted_starts.sort();
    let mut possible_nexts: Vec<u32> = Vec::new();

    // roll a random number to choose possible start
    let rand_roll = rand::random::<usize>() % sorted_starts.len();
    
    // allocate that node
    cur_tree.push(sorted_starts[rand_roll]);
    decisions.push(rand_roll as u32);
    count += 1;

    while count < threshold {

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
            return (cur_tree, decisions);
        }
        
        // sort possible_nexts
        possible_nexts.sort();
        
        // roll again
        let rand_roll = rand::random::<usize>() % possible_nexts.len();

        // allocate new random choice
        cur_tree.push(possible_nexts[rand_roll]);
        decisions.push(rand_roll as u32);

        count += 1
    }

    (cur_tree, decisions)
}

// TODO: need function which parses the tree into the hashed string
// TODO: need function that returns the hashed string, send over socket
