function fibonacciSequence(n) {
    let sequence = [0, 1];
    
    while (sequence.length < n) {
        let nextNum = sequence[sequence.length - 1] + sequence[sequence.length - 2];
        sequence.push(nextNum);
    }

    return sequence;
}

function printFibonacciDoubles(sequence, name) {
    console.log("Fibonacci sequence:");
    for (let num of sequence) {
        console.log(num);
    }

    console.log(`Hi, ${name}, The double of the Fibonacci sequence is:`);
    for (let num of sequence) {
        console.log(`${num} * 2 = ${num * 2}`);
    }

    console.log(`Hi, ${name}, The triple of the Fibonacci sequence is:`);
    for (let num of sequence) {
        console.log(`${num} * 3 = ${num * 3}`);
    }

    console.log(`Thank you ${name}.`);
}

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("How many terms? ", function(n) {
    n = parseInt(n);

    if (isNaN(n) || n <= 0) {
        console.log("Invalid input. Please enter a positive integer.");
        rl.close();
    } else {
        rl.question("Enter your name: ", function(name) {
            rl.close();
            
            // Generate Fibonacci sequence and print doubles
            let fibonacci = fibonacciSequence(n);
            printFibonacciDoubles(fibonacci, name);
        });
    }
});
