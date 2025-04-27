const pem = require("pem");
const fs = require("fs");
const path = require("path");
const https = require('https');
const crypto = require("crypto");

const CERTS_DIR = "./certs";

// Generate a Certificate Authority (CA)

function generateCertificates(params) {
    try {
        pem.createCertificate({ days: 365, selfSigned: true }, (err, ca) => {
          if (err) throw err;
        
          // Generate Server Certificate
          pem.createCertificate(
            {
              serviceKey: ca.serviceKey,
              serviceCertificate: ca.certificate,
              serial: Date.now(),
              days: 365,
            },
            (err, server) => {
              if (err) throw err;
        
              // Generate Client Certificate
              pem.createCertificate(
                {
                  serviceKey: ca.serviceKey,
                  serviceCertificate: ca.certificate,
                  serial: Date.now(),
                  days: 365,
                },
                (err, client) => {
                  if (err) throw err;
        
                  // Save the certificates
                  fs.writeFileSync(path.resolve(CERTS_DIR,"ca.crt"), ca.certificate);
                  fs.writeFileSync(path.resolve(CERTS_DIR,"server.crt"), server.certificate);
                  fs.writeFileSync(path.resolve(CERTS_DIR,"server.key"), server.clientKey);
                  fs.writeFileSync(path.resolve(CERTS_DIR,"client.crt"), client.certificate);
                  fs.writeFileSync(path.resolve(CERTS_DIR,"client.key"), client.clientKey);
        
                  console.log("Certificates generated successfully!");
                }
              );
            }
          );
        });
        
    } catch (error) {
        console.log(error);
        
    }
}


// Load the server certificate and key
function checkCertificate(certPath,keyPath) {
    const serverCert = fs.readFileSync(certPath, "utf8");
    const serverKey = fs.readFileSync(keyPath, "utf8");
    
    // Convert the certificate to a public key
    const certObj = crypto.createPublicKey(serverCert);
    const keyObj = crypto.createPrivateKey(serverKey);
    
    // Check if they match
    try {
      const isValid = certObj.asymmetricKeyType === keyObj.asymmetricKeyType;
      console.log(isValid ? "✅ Certificate matches private key" : "❌ Mismatch!");
    } catch (err) {
      console.error("Error verifying:", err);
    }
}

checkCertificate(
    path.resolve(CERTS_DIR,'server.crt'),
    path.resolve(CERTS_DIR,'client.key')
)