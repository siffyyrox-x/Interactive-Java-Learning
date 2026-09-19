class Main {
  public static void main(String[] args) {
    int count = 0;
    for (int i = 1; i <= 4; i++) {
      for (int j = 1; j <= 4; j++) {
        if ((i + j) % 2 == 0) continue;
        count += i + j;
        if (count > 15) break;
        System.out.print(count + " ");
      }
      System.out.println("|" + i);
    }
    System.out.println(count);
  }
}
