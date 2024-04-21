---
title: "Network Security"
date: 2022-01-06T22:39:42+08:00
lastmod: 2022-01-06T22:39:42+08:00
draft: false
author: "Chasing1020"
comment: true
keywords: []
description: ""
tags: ['Network']
categories: ['Note']
image: "rsa.webp"
---

# 1. Definition of security

- confidentiality: only sender, intended receiver should “understand” message contents 

    - sender encrypts message
    - receiver decrypts message
- authentication: sender, receiver want to confirm identity of each other 
- message integrity: sender, receiver want to ensure message not altered (in transit, or afterwards) without detection
- access and availability: services must be accessible and available to users. Access is the basis of availability.

Without network security, the intruder can eavesdrop, insert messages, impersonation, hijacking(taking over ongoing connection), denial of service and so on.

# 2. Principles of cryptography

we can define that:

m: plaintext message

$K_A(m)$: ciphertext, encrypted with key $K_A$

$m = K_B(K_A(m))$

There are two kinds of scheme about attacking: 1. cipher-text only attack; 2. known-plaintext attack and chosen-plaintext attack.

>   DES: Data Encryption Standard

56-bit symmetric key, 64-bit plaintext input. Block cipher with cipher block chaining.

3DES: encrypt 3 times with 3 different keys.

>   AES: Advanced Encryption Standard

processes data in 128 bit blocks. 

Using block chiper, the ith input as $m(i)$, let $c(i) = m(i)\ xor\ c(i-1)$.

>   RSA: Rivest, Shamir, Adelson algorithm

Creating public/private key pair: Let m be the plain text message that the originator will encrypt and send to the intended recipient. Let e be the public encryption key, d the private decryption key, c the ciphertext.

proof:  Let $n = pq \implies \varphi(n) = (p − 1)(q − 1)$ 

Euler's theorem: $m^{\varphi(n)}\equiv1\ (mod\ n)$

$\implies m^{(p-1)(q-1)}\equiv1 \mod(pq)$

$\implies m^{k\varphi(n)+1}\equiv m \mod(pq)$

Based on the RSA basic principle, $ed = k\varphi(n)+1$.

This is equivalent to say we need to satisfy: $ed\equiv1(mod \varphi(n))$

If e is determined, $dmod\varphi(n)$ could be determined, using the [Extend Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm) which takes $O(log^2\varphi(n))$ to run.

# 3. Message integrity

Cryptographic technique analogous to hand-written signatures.

>   Digital signatures: signed message digest

Suppose Alice receives msg m, with signature: m, $K_B^-(m)$

Alice verifies $m$ signed by Bob by applying Bob’s public key $K_B^+$ to $K_B^-(m)$ then checks whether $K_B^+(K_B^-(m)) = m$

If $K_B^+(K_B^-(m)) = m$, whoever signed m must have used Bob’s private key

>   Hash function algorithms

MD5 hash function widely used (RFC 1321) : 

-   computes 128-bit message digest in 4-step process. 

-   arbitrary 128-bit string x, appears difficult to construct msg m whose MD5 hash is equal to x

SHA-1 is also used: 

-   US standard [NIST, FIPS PUB 180-1]

-   160-bit message digest

>   Public key Certification Authorities (CA)

-   certification authority (CA): binds public key to particular entity, **E**.

-   entity (person, website, router) registers its public key with CE provides “proof of identity” to CA (bind by OS).

    -  CA creates certificate binding identity **E** to **E**’s public key.

    -  certificate containing E’s public key digitally signed by CA: CA says “this is **E**’s public key”.

# 4. Securing TCP connections: TLS

TLS is a widely deployed security protocol above the transport layer; supported by almost all browsers, web servers: https (port 443)

TLS provides: 1.confidentiality: via *symmetric encryption*; 2. integrity: via *cryptographic hashing*; 3. authentication: via *public key cryptography*.

TLS needed: 

handshake: Alice, Bob use their certificates, private keys to authenticate each other, exchange or create shared secret.

key derivation: Alice, Bob use shared secret to derive set of keys

data transfer: stream data transfer: data as a series of records not just one-time transactions

connection closure: special messages to securely close connection

Which need four keys: 

$K_c$: encryption key for data sent from client to server

$M_c$: MAC key for data sent from client to server

$K_s$: encryption key for data sent from server to client

$M_s$: MAC key for data sent from server to client

>   Diffie Hellman Algorithm

DH algorithm is based on a famous problem called Discrete Logarithm Problem (DLP).

It based on a theory that if I define a prime p, and *g* is a [primitive root modulo](https://en.wikipedia.org/wiki/Primitive_root_modulo_n) p. If gives you a random number $a$, it is esay to calculate $g^amodp$. But it is difficult to get the inverse solution $a$ if you only have $p$, $g$, and $g^amodp$.	

They first agree between them a large prime number p, and a generator (or base) g (where 0 < g < p).

Alice chooses a secret integer a (her private key) and then calculates $g^a mod p$ (which is her public key). Bob chooses his private key b, and calculates his public key in the same way.

Bob knows $b$ and $g^a$, so he can calculate $(g^a)^b mod p = g^{ab} mod p$. Therefore both Alice and Bob know a shared secret $g^{ab} mod p$. An eavesdropper Eve who was listening in on the communication knows p, g, Alice’s public key $(g^a mod p)$ and Bob’s public key $(g^b mod p)$. She is unable to calculate the shared secret from these values.

$(g^a mod p)^b mod p = g^{ab} mod p$

$(g^b mod p)^a mod p = g^{ba} mod p$


>   TLS: 1.3 cipher suite

“cipher suite”: algorithms that can be used for key generation, encryption, MAC, digital signature.

1.   client TLS hello message: 

-   guesses key agreement protocol (DH key agreement protocol), parameters

-   indicates cipher suites it supports

2.   server TLS hello msg chooses 

-   key agreement protocol (DH key agreement protocol), parameters

-   selected cipher suite

-   server-signed certificate

-   then client will: 1. checks server certificate; 2. generates key; 3.can now make application request (e.g.., HTTPS GET)

Recover connection: 

initial hello message contains encrypted application data!

- “resuming” earlier connection between client and server 

- application data encrypted using “resumption master secret” from earlier connection

vulnerable to replay attacks!

-   maybe OK for get HTTP GET or client requests not modifying server state

# 5. IPSec

IPSec provides datagram-level encryption, authentication, integrity, and it has two types:

1.   transport mode: only datagram payload is encrypted, authenticated.

2. tunnel mode: entire datagram is encrypted, authenticated. Encrypted datagram encapsulated in new datagram with new IP header, tunneled to destination.

# 6. Firewall

Firewall isolates organization’s internal network from larger Internet, allowing some packets to pass, blocking others.

Stateless packet filtering examples: 

| Policy                                                       | Firewall  Setting                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| no outside Web access                                        | drop  all outgoing packets to any IP address, port 80        |
| no incoming TCP connections, except those for institution’s public Web server only | drop  all incoming TCP SYN packets to any IP except 130.207.244.203, port 80 |
| prevent Web-radios from eating up the available bandwidth.   | drop  all incoming UDP packets - except DNS and router broadcasts |
| prevent your network from being used for a smurf DoS attack  | drop  all ICMP packets going to a “broadcast”  address (e.g. 130.207.255.255) |
| prevent your network from being tracerouted                  | drop  all outgoing ICMP TTL expired traffic                  |

