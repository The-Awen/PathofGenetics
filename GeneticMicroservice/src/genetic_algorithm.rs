use rand;
use std::collections::HashMap;

// Generate a random tree. The possible_starts refers to a specified class
pub fn gen_random_tree(adjacencies: &HashMap<u32, 
                       Vec<u32>>, possible_starts: &Vec<u32>) -> Vec<u32> {

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

