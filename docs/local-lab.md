# 本地运行与面试演示

当前方案使用现有电脑、Docker 和开源组件，不创建 AWS 或 Phala 资源，云服务费用为零。首次拉取镜像与安装依赖需要网络；完整环境就绪后，链、数据库及签名验收均在本机执行。Go 首次编译可能还需下载依赖。

## 环境与范围

| 组件 | 本地实现 | 对外描述 |
|---|---|---|
| Go / PostgreSQL | 真实数据库，事务、约束、复式账本、任务与预留 | 资金核心与故障恢复实验 |
| Bitcoin Core | 本地真实节点与 regtest 区块链 | BTC regtest 充提、归集及重组验收 |
| MPC | tss-lib 新鲜 DKG 与 2/3 门限 ECDSA | 同机进程内协议实验 |
| HSM | SoftHSM PKCS#11 软件令牌 | 软件 HSM 集成与不可导出密钥测试 |
| TEE | 本地构造 COSE / 测试证书并验证安全策略 | Nitro 证明校验组件，不声称硬件隔离 |
| TRON / EVM 托管 | 显式模拟 Adapter | 多网络抽象与业务恢复演示 |

先安装 Go、C 编译器、Python 3、Docker Compose、SoftHSM 和 ripgrep。macOS 可使用已安装的 Colima / Docker；安装 SoftHSM 的命令为 `brew install softhsm`。Ubuntu 对应 `sudo apt-get install softhsm2 ripgrep`。启动 Docker 引擎后进入仓库。

## 启动和演示

终端一：

```sh
make local-up
```

命令初始化或复用 `.local/dev.env`、操作员密钥和开发钱包目录，启动依赖后在前台运行 API。默认本地端口为 API 8080、PostgreSQL 55432、Bitcoin RPC 18443。首次启动可能需要下载镜像。

终端二：

```sh
make local-demo
```

顺序运行两条流程：

1. **模拟 TRON 的资金状态演示**：充值两次但只入账一次；相同幂等键返回同一笔提现；两个操作员签名；注入广播结果未知；确认后仍使用原交易；归集后用户可用负债不变，静止对账差额为零。
2. **真实 BTC regtest 的 HTTP 演示**：矿工钱包提供测试币，扫描确认充值；提现经过 API、审批、PSBT 签名、Core mempool 与两次确认；再完成归集，验证用户负债不变及两个 BTC 地址的对账差额为零。

演示输出仅包含测试交易 ID、确认信息、业务余额和校验结论。记录位于 `.local/http-acceptance.json` 与 `.local/bitcoin-http-acceptance.json`。BTC 演示会生成新用户和新地址，可重复运行；测试币不具有主网价值。演示期间保持单人操作，静止对账不包含其他并发资金操作。

API 的签名 Provider 默认是本地开发密钥。MPC / PKCS#11 对 BTC 的真实集成通过下面的完整验收分别验证，不会在 API 状态中把默认本地密钥标成 MPC 或硬件 HSM。

结束时在终端一按 Ctrl+C，然后：

```sh
make local-down
```

该命令停止演示依赖并保留数据库与节点数据卷。再次 `make local-up` 可以继续；不要删除 `.local` 或日常数据卷来“重置”一个仍有记录的演示环境。

## 完整验收

```sh
make local-check
```

该命令不依赖 API 已启动。为本次验收生成唯一 Compose 项目与独立数据卷，默认使用 PostgreSQL 55433 和 Core 18543；不会向日常演示的 Core 执行 invalidateblock。

验证步骤：

1. 启动临时数据库和真实 Core，初始化专用 SoftHSM 令牌。
2. 运行 go vet 和全套 `go test -json -race -count=1`，确认并发提现、广播未知恢复、独立 signer、真实 BTC、软件令牌和 Nitro 校验测试确实通过，且没有跳过。
3. 生成本轮全新的 MPC 三份分片，执行实际 DKG、2/3 签名与单方拒绝；再用该 Provider 签名 BTC 提现，交由 Core 确认。
4. 使用专用 SoftHSM 私钥重复 BTC 提现、归集、重组冲正与重新确认测试。
5. 记录结果，删除本轮临时容器及卷。分片、令牌及日志保存在忽略提交的 `.local/acceptance/<run-id>/`，方便本机复核；不要发布分片和令牌文件。

最新报告为 `.local/verification-latest.json`，其中包含每个阶段的通过状态、实际运行的测试名称、日志路径，以及明确的验证环境。MPC 的预参数生成可能耗时数分钟，请等待命令完成。

若验收端口被占用，可在运行时覆盖：

```sh
SETTLEFORGE_CHECK_PG_PORT=55434 SETTLEFORGE_CHECK_BTC_PORT=18544 make local-check
```

GitHub 的 custody CI 使用同一个 `make local-check` 入口，并只上传报告和日志，不上传测试密钥、分片或令牌。

## 面试讲解顺序

建议在十分钟内展示以下证据：

1. 说明用户余额是平台负债，归集只移动地址资产，不能再次给用户入账。
2. 运行模拟 HTTP 演示，解释“超时不等于失败”，展示广播未知状态和最终使用的相同交易 ID。
3. 展示 BTC 交易 ID、Core 确认及余额对账结果，打开 PSBT 解析和 UTXO 数据库预留实现。
4. 打开完整报告中的 MPC / PKCS#11 BTC 测试，讲解 Provider 接口、两种签名格式和私钥边界。
5. 打开 signer 和 attestation 负面测试，说明篡改接收方、金额、费用、PCR、nonce 或审批时的拒绝行为。

简历建议表述：使用 Go / PostgreSQL 实现个人开源的充提归集与复式账本，完成 BTC regtest、同机 MPC 及 SoftHSM 端到端验收，并实现 Nitro 证明的本地校验组件。

云端真机验证、物理 HSM 与生产资金托管属于扩展范围；此前的 [Nitro 资源报价](nitro-deployment.md) 保留为备选资料，本轮不执行。
