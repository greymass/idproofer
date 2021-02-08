# idproofer

EOSIO Identity Proof verification service

## Usage

POST proof a JSON object (`{proof: <proof_json>}`) or auth string (`{proof: "EOSIO <proof_str>"}`) to `/`. The response code will be 200 if the proof is valid and the body will contain the account object. If the proof is invalid the response code is 401.

You can also submit the proof as an `Authorization` header instead of as the request body.

### Example

Verify JSON id proof using curl:

```
curl 'http://localhost:8080' -X 'POST' --data-binary '{"proof": {"chainId": "2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840","scope": "w.local.gm","expiration": "2021-02-08T07:54:15","signer": {"actor": "x.gm","permission": "active"},"signature": "SIG_K1_KaQ2t5YVQ1Ynvy5Y9UVAvWy3V4N4xXomNGHEmSJx2xc3DLJeUZWYGWknDJwALD5ViuszfGrDeCNbCRH2ji1G3yGeX8g2FH"}}'
```
<br>

Verify EOSIO auth header proof using HTTPie:

```
http post localhost:8080 Authorization:"EOSIO KgKgBT5ajPc6VroP2hHk2S4COKSiqnT8z0bVqRB0aEAAgGQgGkQj4CfuIGAAAAAAACAZ6AAAAACo7TIyACArMDogI4G3insybxF7TaCj7OaF1rNJ9IVIlM+IJwPEswfZo/HA9dFyQQslFXYPMJ5BOnblfFNfk6lE5cxduCRz"
```
<br>

## Configuration

You can configure the service to verify multiple EOSIO chains, set the `CHAINS` environment variable or edit your `./config/local.toml`. See `./config/default.toml` for a list of all available options and `./config/custom-environment-variables.toml` for their environment variable equivalents.

### Example

```shell
export CHAINS='[{"name":"BeefNet","node":"https://node.beef.net","id":"beefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef"}]'
```
<br>

## Run with docker

```
$ docker build .
...
<container id>
$ docker run -d --name idproofer <container id>
```
