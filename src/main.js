import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/marketplace.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x6f3D8580bbaADcbCDBC949a804D0cb7C9C21D246"
const cUSDContractAddress = "0x68DB12FFf61176921407EE87bfbDaE4252fC9D76"

let kit
let contract
let gigs = []

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getGigs = async function() {
  const _gigsLength = await contract.methods.getGigsLength().call()
  const _gigs = []
  for (let i = 0; i < _gigsLength; i++) {
    let _gig = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readGig(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        gig: p[2],
        description: p[3],
        location: p[4],
        price: new BigNumber(p[5]),
        sold: p[6],
      })
    })
    _gigs.push(_gig)
  }
  gigs = await Promise.all(_gigs)
  renderGigs()
}

function renderGigs() {
  document.getElementById("marketplace").innerHTML = ""
  gigs.forEach((_gig) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = gigTemplate(_gig)
    document.getElementById("marketplace").appendChild(newDiv)
  })
  console.log(gigs);
}

function gigTemplate(_gig) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_gig.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_gig.sold} Sold
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_gig.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_gig.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_gig.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_gig.location}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _gig.index
          }>
            Buy for ${_gig.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getGigs()
  notificationOff()
});

document
  .querySelector("#newGigBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newGigName").value,
      document.getElementById("newGigUrl").value,
      document.getElementById("newGigDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeGig(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getGigs()
  })

  document.querySelector("#marketplace").addEventListener("click", async (e) => {
    if (e.target.className.includes("buyBtn")) {
      const index = e.target.id
      notification("⌛ Waiting for payment approval...")
      try {
        await approve(gigs[index].price)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      notification(`⌛ Awaiting payment for "${gigs[index].name}"...`)
      try {
        const result = await contract.methods
          .buyGig(index)
          .send({ from: kit.defaultAccount })
        notification(`🎉 You successfully bought "${gigs[index].name}".`)
        getGigs()
        getBalance()
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    }
  }) 