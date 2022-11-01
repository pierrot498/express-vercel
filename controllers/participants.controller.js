const db = require("../models");
const Sequelize = require('sequelize');
const { ethers } = require("ethers");
const Dboe = db.participants;
const Op = db.Sequelize.Op;
const  abi  = require("../assets/abi.json");
require('dotenv').config();
const {
  PRIVATE_KEY_SIG,
  GOERLI_NODE,
  CONTRACT
} = process.env;
// Create and Save a new DBOE
exports.create = (req, res) => {
  // Validate requestƒ
  
  if (!req.body.address) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  if(!ethers.utils.isAddress(req.body.address))
  {
    res.status(500).send({
      message:
        "addr is invalid"
    });
    return;
  }

  // Create a dboe
  const dboe = {
    points: 0,
    username: req.body.username,
    email: req.body.email,
    address: req.body.address,
  };

  Dboe.findByPk(req.body.address)
    .then(data => {
      if (data)
      {
        res.send("Address already exist");
      }
      else{
        // Save dboe in the database if address does not exist
        Dboe.create(dboe)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the dboe."
          });
        });
      }    
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving address=" + address
      });
    });
};

// Retrieve all dboes from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.iLike]: `%${title}%` } } : null;
  Dboe.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dboes."
      });
    });
};

// Find a single dboe with an id
exports.findOne = (req, res) => {
  const address = req.params.address;
  Dboe.findByPk(address)
    .then(data => {
      console.log(data)
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving dboe with address=" + address
      });
    });
};

// Update a dboe by the id in the request
exports.update = (req, res) => {
  const address = req.params.address;

  Dboe.update(req.body, {
    where: { address: address }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "dboe was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update dboe with address=${address}. Maybe dboe was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating dboe with address=" + address
      });
    });
};

// refresh action to update user points
exports.refresh = (req, res) => {
  getEvents().then(e => {
    const data = e.data;
    data.map(i => {
      const point = calculPoint(i, e.results)
      Dboe.update({points: point}, {
        where: { address: i.address }
      })
      console.log(i.address)
    })
    // .then(num => { 
    //     res.send({
    //       message: "dboe was updated successfully."
    //     });  
    // })
  })
  .then(num => { 
        res.send({
          message: "dboe was updated successfully."
        });  
    })
};


// refresh action to update user points
exports.bestPlayer = (req, res) => {
  Dboe.findAll({
    order: [
      ["points", "DESC"],
      ["username", "ASC"],
    ],
  }).then((players) => {
    res.send(JSON.stringify(players, null, 2));
  });
};

// claim action to get signature
exports.claim = (req, res) => {
  const addr = req.params.address;

  if(!ethers.utils.isAddress(addr))
  {
    res.status(500).send({
      message:
        "addr is invalid"
    });
    return;
  }

  Dboe.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('points')), 'total_points'],
    ],
    raw: true,
  }).then(e=>{
    Dboe.findByPk(addr)
    .then(user => {
    const provider = new ethers.providers.JsonRpcProvider(GOERLI_NODE);
    const Contract = new ethers.Contract(CONTRACT, abi, provider);

    Contract.pricePool().then(pricePool=> {
      const ratio =  (user.points / e[0].total_points)
      const ammountW = Math.round(Number(pricePool.toString()) * ratio)
      const signer = new ethers.Wallet(PRIVATE_KEY_SIG);
      const data = {
        user: addr, 
        ammount: ammountW,  
        timestamp: ethers.BigNumber.from(Math.floor(Date.now() / 1000).toString()),  
      }
      const domain = { 
        name: 'Ether signature', 
        version: '1', 
        chainId: 1, 
        verifyingContract: CONTRACT, 
      }
      const types = { 
        Voucher: [ 
          { name: 'user', type: 'address' },
          { name: 'ammount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      }
      signer._signTypedData(domain, types, { ...data }).then(signat=>{
        res.send({signature: signat, data: data});     
      }) 
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving pricePool"
      });
    });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving dboe with address=" + addr
      });
    });
  })
  .catch(err => {
    res.status(500).send({
      message: "Error to sum points of all users"
    });
  });; 
};

// Delete a dboe with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  dboe.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "dboe was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete dboe with id=${id}. Maybe dboe was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete dboe with id=" + id
      });
    });
};

// Delete all dboes from the database.
exports.deleteAll = (req, res) => {
  dboe.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} dboes were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all dboes."
      });
    });
};

async function getEvents() {
  const provider = new ethers.providers.JsonRpcProvider(GOERLI_NODE);
  const Contract = new ethers.Contract(CONTRACT, abi, provider);
  const filterFrom = Contract.filters.Bet();
  
  var addressBet = [];
  var dataSort = [];

  var poolsId = [];
  var poolsResult = [];

  var dataStamp = (await Contract.queryFilter(filterFrom, 154756, "latest"))

  await Promise.all( dataStamp.map(async (e) => {
    if (!poolsId.includes(e.args.poolId.toString()))
    {
      poolsId.push(e.args.poolId.toString())
      const poolId = Number(e.args.poolId.toString())
      const result = await Contract.pool(poolId)
      if(!result.isActive)
      {
        poolsResult.push({poolId: poolId, scoreA: Number(result.scoreA.toString()), scoreB: Number(result.scoreB.toString()), winA: result.winA}) //result.scoreA a refaire
        console.log(poolsResult);
      }     
    }
    

    if (addressBet.includes(e.args.bettor.toString()))
    {
      dataSort[addressBet.indexOf(e.args.bettor.toString())].bet.push({
          poolId: Number(e.args.poolId.toString()),
          pointA: Number(e.args.pointA.toString()),
          pointB: Number(e.args.pointB.toString()),
          winA: e.args.winA,
      })
    }
    else{
      addressBet.push(e.args.bettor.toString())
      dataSort.push({
        address: e.args.bettor.toString(),
        bet: [{
          poolId: Number(e.args.poolId.toString()),
          pointA: Number(e.args.pointA.toString()),
          pointB: Number(e.args.pointB.toString()),
          winA: e.args.winA,
        }],
      })
    }  
  }))
  return {data: dataSort, results: poolsResult};
}

function calculPoint(i, results)
{
  const allPoints = i.bet.map(p => {
    //calcul de points
    const rslt = getGoodPool(p.poolId, results)
    if(!rslt)
    {
      return 0
    }
    if (p.pointA == rslt.scoreA && p.pointB == rslt.scoreB && p.winA == rslt.winA){
      return 3
    }
    else if(p.winA == rslt.winA){
      return 1
    }
    else{
      return 0
    }
  })
  const a = allPoints.reduce((partialSum, a) => partialSum + a, 0);
  return a;
}

function getGoodPool(poolId, results)
{
  var i = 0;
  while(i < results.length)
  {
    if (results[i].poolId == poolId)
    {
      return results[i]
    }
    i ++;
  }
}


