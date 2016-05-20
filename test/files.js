/* eslint-env mocha */
'use strict'

const bl = require('bl')
const expect = require('chai').expect
const Readable = require('stream').Readable
const bs58 = require('bs58')
const isNode = require('detect-node')
const fs = require('fs')
const DAGNode = require('ipfs-merkle-dag').DAGNode

const path = require('path')
const streamEqual = require('stream-equal')


// const IPFS = require('../../src/core')

let testfile
let testfileBig

// if (isNode) {
//   testfile = fs.readFileSync(path.join(__dirname, '/../testfile.txt'))
//   testfileBig = fs.createReadStream(path.join(__dirname, '/../15mb.random'), { bufferSize: 128 })
// } else {
//   testfile = require('raw!../testfile.txt')
// }

function addTestData (ipfs, str, cb) {
  const dNode = new DAGNode(new Buffer(str))
  const buf = dNode.marshal()
  ipfs.object.put(buf, { enc: 'protobuf' }, cb)
}

module.exports = (common) => {
  describe('.cat', () => {
    let ipfs

    before((done) => {
      common.setup((err, _ipfs) => {
        expect(err).to.not.exist
        ipfs = _ipfs
        done()
      })
    })

    after((done) => {
      common.teardown(done)
    })

  // before((done) => {
  //   ipfs = new IPFS(require('./repo-path'))
  //   ipfs.load(done)
  // })

    it('cat', (done) => {
      addTestData(ipfs, 'hello world\n', (err, node) => {
        expect(err).to.not.exist

        console.log(bs58.encode(node.multihash()).toString())

        const hash = 'QmNnXukKBJTLBysrJfpuDe3VjWHZQLobb8DMSr933JRhVK'
        ipfs.files.cat(hash, (err, res) => {
          expect(err).to.not.exist
          res.on('file', (data) => {
            data.stream.pipe(bl((err, bldata) => {
              expect(err).to.not.exist
              expect(bldata.toString()).to.equal('hello world\n')
              done()
            }))
          })
        })
      })
    })

    it('cat', (done) => {
      const hash = 'Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP'
      ipfs.files.cat(hash, (err, res) => {
          expect(err).to.not.exist

          let buf = ''
          res
            .on('error', (err) => {
              expect(err).to.not.exist
            })
            .on('data', (data) => {
              buf += data
            })
            .on('end', () => {
              // expect(buf).to.be.equal(testfile.toString())
              done()
            })
        })
    })

    it('cat BIG file', (done) => {
      if (!isNode) {
        return done()
      }

      const hash = 'Qme79tX2bViL26vNjPsF3DP1R9rMKMvnPYJiKTTKPrXJjq'
      ipfs.files.cat(hash, (err, res) => {
        expect(err).to.not.exist

        // Do not blow out the memory of nodejs :)
        // streamEqual(res, testfileBig, (err, equal) => {
        //   expect(err).to.not.exist
        //   expect(equal).to.be.true
        //   done()
        // })
        done()
      })
    })

    describe('promise', () => {
      it('cat', (done) => {
        const hash = 'Qma4hjFTnCasJ8PVp3mZbZK5g2vGDT4LByLJ7m8ciyRFZP'
        return ipfs.files.cat(hash)
          .then((res) => {
            let buf = ''
            res
              .on('error', (err) => {
                throw err
              })
              .on('data', (data) => {
                buf += data
              })
              .on('end', () => {
                // expect(buf).to.be.equal(testfile.toString())
                done()
              })
          })
      })
    })
  })
}
