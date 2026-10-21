# Nitro 真机验收资源与成本

**方案状态：备选资料，当前不执行。** 当前选择 [本地运行方案](local-lab.md)，本轮不创建云资源。以下保留原报价与扩展验收范围，未授权自动部署。

建议先进行一次 **4 小时的新加坡区域验收，预留 5 美元预算**。本页只给部署范围和报价，尚未创建 AWS 资源。资源用于测试网 / regtest，不承载生产资产。

价格核对日期：2026-10-21。区域 `ap-southeast-1`，Linux 按需、共享租用、美元、税前；不使用预留实例、Spot、账户赠金或免费额度抵扣。

## 资源清单

| 资源 | 数量与配置 | 用途 |
|---|---|---|
| EC2 | 1 台 c6i.xlarge，4 vCPU / 8 GiB，Amazon Linux 2023 x86_64，EnclaveOptions.Enabled=true | 父实例运行 Core regtest、测试工具、vsock 代理 |
| Nitro enclave | 从父实例划分 2 vCPU / 2 GiB | 非 debug EIF 内生成 / 使用测试签名密钥并获取 NSM 证明 |
| EBS | 20 GB gp3，默认 3,000 IOPS / 125 MB/s | 系统、构建缓存和测试数据；删除实例时删除卷 |
| KMS | 1 把对称 customer managed key | 验证带 RecipientAttestation 的密钥封装与解封策略 |
| 网络 | 1 个 VPC / 公有子网、Internet Gateway、路由、1 个自动分配公网 IPv4 | 拉取依赖、SSM 和 AWS API；安全组不开放入站端口 |
| IAM | 父实例角色 / instance profile、SSM 会话权限、限定测试 KMS 的策略 | 身份与访问控制；使用 SSM 登录管理 |
| 证据与日志 | 导出 PCR、证明校验结果、测试交易、负面测试及少量日志 | 写入项目验收记录；不记录私钥和 PIN |

c6i.xlarge 在 AWS 的支持类型范围内。划分给 enclave 的 CPU / 内存包含在父实例规格内，Nitro 没有额外服务费。[实例要求](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html)、[C6i 规格](https://aws.amazon.com/ec2/instance-types/c6i/)、[Nitro 定价](https://aws.amazon.com/ec2/nitro/nitro-enclaves/)。

## 成本明细

| 项目 | 核对单价 | 4 小时 | 连续 730 小时 |
|---|---:|---:|---:|
| c6i.xlarge | $0.196 / 小时 | $0.7840 | $143.08 |
| 公网 IPv4 × 1 | $0.005 / 小时 | $0.0200 | $3.65 |
| gp3 20 GB | $0.096 / GB 月 | 约 $0.0105 | $1.92 |
| KMS key × 1 | $1 / 月，按小时比例 | 约 $0.0055 | $1.00 |
| 对称 KMS 调用 1,000 次 | $0.03 / 10,000 次，不抵扣免费量 | $0.0030 | $0.0030 |
| **基础合计** | | **约 $0.823** | **约 $149.65** |

4 小时和 730 小时两列均假设总共 1,000 次 KMS 操作。gp3 的短期金额用 730 小时折算估计，实际按 AWS 存储计费规则计算。

EC2 和 gp3 数值直接读取 AWS 定价页使用的公开价格数据，并在仓库保存了所选条目的 rateCode 与发布日期：[EC2 数据](https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/Asia%20Pacific%20(Singapore)/Linux/index.json)、[EBS 数据](https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ebs.json)、[报价条目快照](aws-price-snapshot.json)。其他单价来自 [VPC 定价](https://aws.amazon.com/vpc/pricing/) 和 [KMS 定价](https://aws.amazon.com/kms/pricing/)。

流量、可选日志服务和税费按实际发生另计，不包含在基础合计。4 小时预留 $5 便于重试；若运行 24 小时，基础约 $4.92，建议改用 $10 预算。预算提醒不能硬性封顶账单。

## 执行顺序与验收结果

1. 用独立测试角色创建上述资源，验证实例的 enclave 选项、CPU 和内存分配；设置 4 小时实验结束保护，并记录资源 ID。
2. 补齐 enclave 签名运行时和 NSM / vsock 集成，构建 EIF，记录 PCR0/1/2；以非 debug 模式启动。
3. 获取 AWS 真机签名的证明，使用当前校验器验证证书链、COSE、测量、新鲜挑战、公钥和策略绑定；保留不含私钥的证据。
4. 把双人审批和交易解析放入受测签名路径，签出 BTC regtest 交易，经 Core 接纳并确认；验证改金额、接收方、找零、费用和审批时拒绝签名。
5. 配置 KMS RecipientAttestation 约束，验证正确测量可解封、错误测量 / debug enclave / 无证明父实例调用被拒绝。KMS 集成当前仍需实现，不把部署计划当作已完成代码。
6. 单独评审密钥恢复与签名状态防回滚；在通过前仅使用可丢弃测试密钥，不升级为生产托管。
7. 导出测试证据后销毁实例、EBS 和网络资源；KMS key 安排删除，核对残留资源。实例停止后，保留的 EBS 和有效 KMS key 仍可能收费；KMS 进入待删除状态的计费规则见其官方定价页。

## 启动前需要的信息

- AWS 账号可用的临时角色 / SSO profile，以及允许部署的账号与区域；在本机完成登录，不把访问密钥发到聊天或仓库。
- 确认本次采用新加坡区域、4 小时窗口、5 美元预算。当前尚未执行付费资源创建。
- 验收完成后的保留要求：默认导出证据后清理实验资源。KMS 删除存在等待期，不能等同于即时物理删除。

当前已经完成的是本地 Nitro 证明验证组件。AWS 真机证明、enclave 内签名、KMS 解封和防回滚验收完成后，再更新项目和简历的 TEE 交付状态。
