# SettleForge

**Go 钱包核心、交易管理与资金安全工程项目。** PostgreSQL 复式账本、充值索引、提现与归集状态机、RFQ 询价与资金预留、Bitcoin Core、独立签名策略及 MPC / PKCS#11 / Nitro 证明验证。

[![CI](https://github.com/thunderxu7-sketch/settleforge/actions/workflows/ci.yml/badge.svg)](https://github.com/thunderxu7-sketch/settleforge/actions/workflows/ci.yml)

## 实现与验证范围

| 模块 | 当前实现 | 验证环境 |
|---|---|---|
| 充值、提现、归集、复式账本 | 整数金额、确认后入账、用户冻结、费用分录、幂等、补偿与对账 | 真实 PostgreSQL，并发及故障测试 |
| RFQ 询价 | 两家签名报价、净价比较、双边库存预留、双人审批、原子结算及过期退款 | **本地合成报价、模拟资产与账本结算**，未接外部 LP 或主网兑换 |
| BTC | P2WPKH、PSBT、UTXO 持久预留、找零、费用上限、签名校验、广播、确认、扫块、重组冲正与重新入账 | Bitcoin Core 30.2 regtest |
| 审批与签名服务 | 两个独立 Ed25519 操作员签名，绑定完整业务指令；独立进程重验审批、钱包与密钥映射、交易内容；签名结果持久化 | HTTP 集成与进程重建测试 |
| MPC | 新鲜 DKG，2/3 GG18 门限 ECDSA，单份分片拒绝；接入 BTC 交易签名 | tss-lib，**同机进程内协议实验** |
| HSM | PKCS#11、secp256k1、不可导出私钥、低 S / 恢复位转换；接入 BTC 交易签名 | **SoftHSM 软件令牌**，非物理 HSM |
| TEE | AWS 根证书链与 COSE 签名验证；PCR0/1/2、调试模式、时间、新鲜挑战、公钥与策略绑定、重放拒绝 | 本地生成测试 CA 的正反例；**未在 Nitro 硬件运行** |
| TRON / EVM 托管适配 | 统一接口、地址、金额模型与显式模拟链 | 未接入真实托管 RPC |
| 浏览器插件 | 从用户自有 tronlink-lite 派生，独立名称与标识，保留 TRON DApp 兼容协议 | 构建验证；未集成托管管理后台 |

当前采用**本地运行方案，云资源费用为零**。资金系统、BTC regtest、MPC 和软件 HSM 在本机验证；TEE 的交付范围是本地证明校验组件。使用方式见 [本地运行与演示](docs/local-lab.md)，技术边界见 [架构](docs/architecture.md)、[验收](docs/validation.md)。

## 启动

需要 Go 1.25+、C 编译器（PKCS#11 包）、Python 3 和 Docker Compose。完整签名验收还需要 SoftHSM 与 ripgrep。Go 依赖可能要求更新的补丁版本，CI 使用 Go 1.27。

```sh
make local-up
```

此命令启动 PostgreSQL / Core、构建二进制、保留已有本地密钥配置，并在前台运行 API。BTC 使用真实 Core regtest，TRON / EVM 使用显式模拟器。另一个终端运行两条 HTTP 充提演示：

```sh
make local-demo
```

询价演示单独运行 `make local-rfq-demo`，专项测试运行 `make test-rfq`。`make local-up` 默认启用 `RFQ_LAB=1`，旧 API 需重启；直接启动二进制默认关闭。流程、数据模型和安全边界见 [RFQ 询价模块](docs/rfq.md)。

API 仅监听 `127.0.0.1:8080`，开发配置位于 `.local/dev.env`。不要把这些本地数据库、RPC 示例凭据用于公网。

## 验收

```sh
make local-check
```

完整验收创建独立临时 PostgreSQL / Core 容器、全新 MPC 分片和 SoftHSM 令牌，依次验证账本与故障恢复、真实 BTC、两种签名 Provider、独立 signer 和本地 Nitro 校验。检查必需测试确实通过，拒绝静默跳过。结束后删除本轮临时容器及卷，保留 `.local/verification-latest.json` 与分项日志；不触碰日常演示的数据卷。

单独运行某一项：

```sh
make test-integration
# 持久化文件、测试账本和 regtest 币都不涉及真实资产。

# 实际门限协议，生成新的 Paillier 参数及三份分片；可能耗时数分钟。
go run ./cmd/mpclab --generate
TEST_SIGNER_MODE=mpc TEST_MPC_DIR="$PWD/.local/mpc" make test-bitcoin

# macOS: brew install softhsm；Linux: apt-get install softhsm2
bash scripts/setup-softhsm.sh
source .local/softhsm/test.env
go test -v ./internal/signing -run TestPKCS11
TEST_SIGNER_MODE=pkcs11 make test-bitcoin
```

`go test ./...` 没有集成测试环境变量时会跳过真实 PostgreSQL、Core 和 SoftHSM 验收；不能把“跳过”当成通过。

## 关键 API

所有 `/v1/` 请求需要 `Authorization: Bearer ...`，JSON 金额使用最小单位的**字符串**。

| 接口 | 用途 |
|---|---|
| `POST /v1/users` | 创建用户 |
| `POST /v1/wallets` | 生成密钥、分配链地址；BTC 导入只读 descriptor |
| `GET /v1/users/{id}/balances` | 可用 / 冻结负债 |
| `POST /v1/withdrawals` | 幂等创建提现、冻结用户金额 |
| `POST /v1/sweeps` | 从充值地址向本网络资金钱包归集 |
| `POST /v1/withdrawals/{id}/approvals` | 提交操作员对完整 Intent 的签名 |
| `GET /v1/withdrawals/{id}` | 查询状态及原交易 ID |
| `GET /v1/reconciliation` | 静止状态下逐地址核对链余额与资产账 |
| `GET /v1/status` | 明确每个网络使用模拟还是 RPC |
| `POST /v1/rfq/quotes` | 并行询价、验签与净到账比较 |
| `POST /v1/rfq/trades` | 幂等接受报价并预留双方资金 |
| `GET /v1/rfq/trades/{id}` | 查询完整指令与结算状态 |
| `POST /v1/rfq/trades/{id}/approvals` | 两个操作员对 RFQ 指令签名审批 |
| `POST /v1/rfq/trades/{id}/cancel` | 取消未完成交易并释放预留 |

创建提现传 `Idempotency-Key`；相同 key 的参数变化返回冲突。

```json
{
  "user_id": "<user UUID>",
  "wallet_id": "<treasury wallet UUID>",
  "network": "btc-regtest",
  "asset": "btc-regtest/BTC",
  "destination": "<bcrt1 address>",
  "amount": "50000",
  "fee_cap": "5000",
  "expires_at": 1799999999
}
```

`expires_at` 必须替换为当前时间之后、24 小时之内的 Unix 秒数。操作员在本地读取指令、签名后提交：

```sh
./bin/settleforge approve --id <withdrawal UUID> --actor operator-a
./bin/settleforge approve --id <withdrawal UUID> --actor operator-b
```

`/v1/dev/*` 仅能为**模拟适配器**注入资金或挖块，不能为真实 BTC 账本伪造充值。

## 仓库结构

```text
cmd/settleforge/     API、持久任务 worker、BTC 扫块、操作员审批 CLI
cmd/signer/          独立签名策略服务
cmd/mpclab/          实际 2/3 门限协议验收
internal/domain/    业务指令与整数金额
internal/store/     PostgreSQL 模型、账本、状态机、预留、扫描游标
internal/chain/     Adapter、显式模拟器、Bitcoin Core / PSBT
internal/service/   充值、提现、归集、恢复、对账与真实节点验收
internal/rfq/       多来源签名询价、净价比较、审批与本地结算实验
internal/signing/   开发密钥、审批证明、PKCS#11、签名规范化
internal/signer/    独立审批与交易重验、持久签名去重
internal/mpclab/    DKG 与门限 ECDSA 协议驱动
internal/attestation/ Nitro COSE 与测量策略验证
apps/extension/     独立命名的历史 TRON 插件客户端
scripts/            可复现演示与软件 HSM 初始化
docs/               架构、安全边界、验收与部署说明
```

## 插件构建

```sh
cd apps/extension
npx --yes pnpm@7.33.7 install --frozen-lockfile
npx --yes pnpm@7.33.7 run build:prd:chrome
```

Chrome 开发者模式加载 `apps/extension/dist/prd`。历史依赖存在弃用与体积警告，尚未完成生产依赖升级。插件保留 `window.tronLink` 等 DApp 协议字段；名称与图标已独立。来源、授权及第三方代码边界见 [NOTICE](NOTICE.md)。
